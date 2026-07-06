import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const JUDGE_ID = "pi-openai-gpt-5.5-medium-subscription";

const DEEPSEEK_API_PRICING_PER_MILLION = {
  inputCacheMiss: 0.14,
  inputCacheHit: 0.0028,
  output: 0.28,
};

const SOLVERS = [
  {
    id: "pi-minimax-m3-high-api",
    label: "MiniMax M3 (high-reasoning)",
    note: "corrida completa",
  },
  {
    id: "pi-zen-deepseek-v4-flash-free-xhigh",
    label: "DeepSeek V4 Flash (max-reasoning)",
    note: "corrida completa",
  },
  {
    id: "pi-openai-gpt-5.4-mini-medium-subscription",
    label: "GPT 5.4 mini (medium-reasoning)",
    note: "corrida completa",
  },
] as const;

type SolverId = (typeof SOLVERS)[number]["id"];

type RunMetrics = {
  readonly totalTokens: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly costUsd: number;
};

type RunRecord = {
  readonly taskId: string;
  readonly course: string;
  readonly runId: string;
  readonly agentId: string;
  readonly status: string;
  readonly finishedAt: string;
  readonly durationSeconds: number;
  readonly runDir: string;
  readonly metrics: RunMetrics;
};

type VerdictRecord = {
  readonly grade: number;
  readonly confidence: string;
  readonly path: string;
};

type TargetRow = {
  readonly taskId: string;
  readonly course: string;
  readonly kind: "standalone" | "cumulative-stage";
};

type SolverTaskResult = {
  readonly target: TargetRow;
  readonly solverId: SolverId;
  readonly run: RunRecord | null;
  readonly verdict: VerdictRecord | null;
};

type SolverSummary = {
  readonly solverId: SolverId;
  readonly label: string;
  readonly completedRuns: number;
  readonly judgedRuns: number;
  readonly meanGrade: number | null;
  readonly medianGrade: number | null;
  readonly atLeastSix: number | null;
  readonly perfect: number | null;
  readonly totalCostUsd: number;
  readonly totalTokens: number;
  readonly totalDurationSeconds: number;
  readonly note: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(`Expected string at ${key}`);
  }
  return value;
}

function optionalNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function walkFiles(dir: string, fileName: string): readonly string[] {
  const out: string[] = [];

  function visit(current: string): void {
    let entries: readonly string[];
    try {
      entries = readdirSync(current);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry === "archive") {
        continue;
      }

      const path = join(current, entry);
      const stats = statSync(path);
      if (stats.isDirectory()) {
        visit(path);
      } else if (entry === fileName) {
        out.push(path);
      }
    }
  }

  visit(dir);
  return out.sort((a, b) => a.localeCompare(b));
}

function discoverTargets(): readonly TargetRow[] {
  const standaloneRoot = join(ROOT, "tasks", "standalone");
  const cumulativeRoot = join(ROOT, "tasks", "cumulative");
  const rows: TargetRow[] = [];

  for (const taskJson of walkFiles(standaloneRoot, "task.json")) {
    const taskDir = taskJson.slice(0, -"task.json".length - 1);
    const taskId = relative(standaloneRoot, taskDir);
    rows.push({ taskId, course: taskId.split("/")[0] ?? taskId, kind: "standalone" });
  }

  for (const taskJson of walkFiles(cumulativeRoot, "task.json")) {
    const taskDir = taskJson.slice(0, -"task.json".length - 1);
    const taskId = relative(cumulativeRoot, taskDir);
    rows.push({ taskId, course: taskId.split("/")[0] ?? taskId, kind: "cumulative-stage" });
  }

  return rows.sort((a, b) => a.taskId.localeCompare(b.taskId));
}

function readSessionMetrics(runDir: string): Partial<RunMetrics & { readonly durationSeconds: number }> {
  const metricsPath = join(runDir, "07-session", "metrics.json");
  try {
    const raw = readJson(metricsPath);
    if (!isRecord(raw)) {
      return {};
    }

    const usage = isRecord(raw.usage) ? raw.usage : {};
    return {
      totalTokens: optionalNumber(usage, "totalTokens"),
      inputTokens: optionalNumber(usage, "inputTokens"),
      outputTokens: optionalNumber(usage, "outputTokens"),
      cacheReadTokens: optionalNumber(usage, "cacheReadTokens"),
      costUsd: optionalNumber(usage, "costUsd"),
      durationSeconds: optionalNumber(raw, "durationSeconds"),
    };
  } catch {
    return {};
  }
}

function parseRun(path: string): RunRecord | null {
  const raw = readJson(path);
  if (!isRecord(raw)) {
    return null;
  }

  const metricsRaw = raw.metrics;
  const metricsRecord = isRecord(metricsRaw) ? metricsRaw : {};
  const taskId = requireString(raw, "taskId");
  const runDir = path.slice(0, -"run.json".length - 1);
  const sessionMetrics = readSessionMetrics(runDir);

  return {
    taskId,
    course: taskId.split("/")[0] ?? taskId,
    runId: requireString(raw, "runId"),
    agentId: requireString(raw, "agentId"),
    status: requireString(raw, "status"),
    finishedAt: typeof raw.finishedAt === "string" ? raw.finishedAt : "",
    durationSeconds: sessionMetrics.durationSeconds ?? optionalNumber(raw, "durationSeconds"),
    runDir,
    metrics: {
      totalTokens: sessionMetrics.totalTokens ?? optionalNumber(metricsRecord, "totalTokens"),
      inputTokens: sessionMetrics.inputTokens ?? optionalNumber(metricsRecord, "inputTokens"),
      outputTokens: sessionMetrics.outputTokens ?? optionalNumber(metricsRecord, "outputTokens"),
      cacheReadTokens: sessionMetrics.cacheReadTokens ?? 0,
      costUsd: sessionMetrics.costUsd ?? optionalNumber(metricsRecord, "costUsd"),
    },
  };
}

function readRuns(): readonly RunRecord[] {
  return walkFiles(join(ROOT, "runs"), "run.json")
    .map(parseRun)
    .filter((run): run is RunRecord => run !== null && run.status === "completed");
}

function latestRunFor(
  runs: readonly RunRecord[],
  taskId: string,
  solverId: SolverId,
): RunRecord | null {
  const matches = runs
    .filter((run) => run.taskId === taskId && run.agentId === solverId)
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
  return matches[0] ?? null;
}

function parseVerdict(path: string): VerdictRecord | null {
  const raw = readJson(path);
  if (!isRecord(raw)) {
    return null;
  }

  const grade = raw.grade;
  if (typeof grade !== "number" || !Number.isFinite(grade)) {
    return null;
  }

  return {
    grade,
    confidence: typeof raw.confidence === "string" ? raw.confidence : "unknown",
    path,
  };
}

function latestVerdict(run: RunRecord): VerdictRecord | null {
  const reviewRoot = join(run.runDir, "06-review", "ai", JUDGE_ID);
  let entries: readonly string[];
  try {
    entries = readdirSync(reviewRoot);
  } catch {
    return null;
  }

  const verdicts = entries
    .map((entry) => join(reviewRoot, entry, "verdict.json"))
    .filter((path) => {
      try {
        return statSync(path).isFile();
      } catch {
        return false;
      }
    })
    .sort((a, b) => b.localeCompare(a))
    .map(parseVerdict)
    .filter((verdict): verdict is VerdictRecord => verdict !== null);

  return verdicts[0] ?? null;
}

function median(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle] ?? null;
  }
  const left = sorted[middle - 1];
  const right = sorted[middle];
  return left === undefined || right === undefined ? null : (left + right) / 2;
}

function mean(values: readonly number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function fmtNumber(value: number | null, digits: number): string {
  return value === null ? "-" : value.toFixed(digits);
}

function fmtUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

function fmtInt(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function estimateApiCost(run: RunRecord): number {
  if (run.agentId !== "pi-zen-deepseek-v4-flash-free-xhigh") {
    return run.metrics.costUsd;
  }

  const cacheMissInputTokens = Math.max(
    0,
    run.metrics.inputTokens - run.metrics.cacheReadTokens,
  );
  return (
    (cacheMissInputTokens * DEEPSEEK_API_PRICING_PER_MILLION.inputCacheMiss) +
    (run.metrics.cacheReadTokens * DEEPSEEK_API_PRICING_PER_MILLION.inputCacheHit) +
    (run.metrics.outputTokens * DEEPSEEK_API_PRICING_PER_MILLION.output)
  ) / 1_000_000;
}

function summarizeSolver(
  solver: (typeof SOLVERS)[number],
  results: readonly SolverTaskResult[],
): SolverSummary {
  const solverResults = results.filter((result) => result.solverId === solver.id);
  const completed = solverResults.filter((result) => result.run !== null);
  const judged = solverResults.filter((result) => result.verdict !== null);
  const grades = judged.map((result) => result.verdict?.grade).filter((grade): grade is number => grade !== undefined);

  return {
    solverId: solver.id,
    label: solver.label,
    completedRuns: completed.length,
    judgedRuns: judged.length,
    meanGrade: mean(grades),
    medianGrade: median(grades),
    atLeastSix: grades.length === 0 ? null : grades.filter((grade) => grade >= 6).length,
    perfect: grades.length === 0 ? null : grades.filter((grade) => grade === 7).length,
    totalCostUsd: completed.reduce(
      (sum, result) => sum + (result.run === null ? 0 : estimateApiCost(result.run)),
      0,
    ),
    totalTokens: completed.reduce((sum, result) => sum + (result.run?.metrics.totalTokens ?? 0), 0),
    totalDurationSeconds: completed.reduce((sum, result) => sum + (result.run?.durationSeconds ?? 0), 0),
    note: solver.note,
  };
}

function markdownSummaryTable(summaries: readonly SolverSummary[], targetCount: number): string {
  const lines = [
    "| Solver | Runs completas | Reviews GPT-5.5 medium | Nota media | Mediana | >= 6.0 | 7.0 | Costo observado | Tokens | Nota |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ];

  for (const summary of summaries) {
    lines.push(
      `| ${summary.label} | ${summary.completedRuns}/${targetCount} | ${summary.judgedRuns}/${targetCount} | ${fmtNumber(summary.meanGrade, 2)} | ${fmtNumber(summary.medianGrade, 1)} | ${summary.atLeastSix === null ? "-" : `${summary.atLeastSix}/${summary.judgedRuns}`} | ${summary.perfect === null ? "-" : `${summary.perfect}/${summary.judgedRuns}`} | ${fmtUsd(summary.totalCostUsd)} | ${fmtInt(summary.totalTokens)} | ${summary.note} |`,
    );
  }

  return lines.join("\n");
}

function buildResults(): {
  readonly targets: readonly TargetRow[];
  readonly results: readonly SolverTaskResult[];
  readonly summaries: readonly SolverSummary[];
} {
  const targets = discoverTargets();
  const runs = readRuns();
  const results = targets.flatMap((target) =>
    SOLVERS.map((solver): SolverTaskResult => {
      const run = latestRunFor(runs, target.taskId, solver.id);
      return {
        target,
        solverId: solver.id,
        run,
        verdict: run === null ? null : latestVerdict(run),
      };
    }),
  );
  const summaries = SOLVERS.map((solver) => summarizeSolver(solver, results));
  return { targets, results, summaries };
}

const { targets, summaries } = buildResults();

console.log(markdownSummaryTable(summaries, targets.length));

import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join, relative } from "node:path";

const ROOT = process.cwd();
const WEB_DATA_DIR = join(ROOT, "web", "public", "data");
const SESSION_DIR = join(WEB_DATA_DIR, "sessions");
const JUDGE_ID = "pi-openai-gpt-5.5-medium-subscription";
const GITHUB_URL = "https://github.com/fgonzalezurriola/uchile-bench";

const DEEPSEEK_API_PRICING_PER_MILLION = {
  inputCacheMiss: 0.14,
  inputCacheHit: 0.0028,
  output: 0.28,
};

const SOLVERS = [
  {
    id: "pi-minimax-m3-high-api",
    label: "MiniMax M3",
    shortLabel: "MiniMax M3",
    reasoning: "high",
    color: "#FF376D",
    logo: "/logos/minimax-color.svg",
  },
  {
    id: "pi-zen-deepseek-v4-flash-free-xhigh",
    label: "DeepSeek V4 Flash",
    shortLabel: "DeepSeek V4 Flash",
    reasoning: "max",
    color: "#4D6BFE",
    logo: "/logos/deepseek.svg",
  },
  {
    id: "pi-openai-gpt-5.4-mini-medium-subscription",
    label: "GPT 5.4 mini",
    shortLabel: "GPT 5.4 mini",
    reasoning: "medium",
    color: "#0EA982",
    logo: "/logos/openai_dark.svg",
  },
] as const;

type SolverId = (typeof SOLVERS)[number]["id"];

type RunMetrics = {
  readonly totalTokens: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly costUsd: number;
  readonly durationSeconds: number;
  readonly totalToolCalls: number;
  readonly totalTurns: number;
};

type UsageRecord = {
  readonly inputTokens?: unknown;
  readonly outputTokens?: unknown;
  readonly cacheReadTokens?: unknown;
  readonly costUsd?: unknown;
};

type RunRecord = {
  readonly taskId: string;
  readonly course: string;
  readonly runId: string;
  readonly agentId: string;
  readonly status: string;
  readonly finishedAt: string;
  readonly runDir: string;
  readonly metrics: RunMetrics;
};

type VerdictRecord = {
  readonly grade: number;
  readonly confidence: string;
  readonly summary: string;
  readonly detail: VerdictDetailRecord;
};

type VerdictEvidenceRecord = {
  readonly path: string;
  readonly lines: string | null;
  readonly description: string;
};

type VerdictDeductionRecord = {
  readonly id: string;
  readonly rootCauseId: string;
  readonly origin: string;
  readonly points: number;
  readonly reason: string;
  readonly evidence: readonly VerdictEvidenceRecord[];
};

type VerdictCriterionRecord = {
  readonly criterionId: string;
  readonly title: string;
  readonly awardedPoints: number;
  readonly maximumPoints: number;
  readonly weight: number;
  readonly justification: string;
  readonly evidence: readonly VerdictEvidenceRecord[];
  readonly deductions: readonly VerdictDeductionRecord[];
};

type VerdictGradeAdjustmentRecord = {
  readonly ruleId: string;
  readonly operation: string;
  readonly value: number;
  readonly triggered: boolean;
  readonly justification: string;
  readonly evidence: readonly VerdictEvidenceRecord[];
};

type VerdictCommandRecord = {
  readonly command: string;
  readonly exitCode: number | null;
  readonly summary: string;
};

type VerdictInheritedObservationRecord = {
  readonly id: string;
  readonly description: string;
  readonly effectOnCurrentAssignment: string;
  readonly evidence: readonly VerdictEvidenceRecord[];
};

type VerdictDetailRecord = {
  readonly criteria: readonly VerdictCriterionRecord[];
  readonly gradeAdjustments: readonly VerdictGradeAdjustmentRecord[];
  readonly commands: readonly VerdictCommandRecord[];
  readonly inheritedObservations: readonly VerdictInheritedObservationRecord[];
  readonly criticalErrors: readonly string[];
  readonly humanReviewItems: readonly string[];
};

type TargetRecord = {
  readonly taskId: string;
  readonly course: string;
  readonly title: string;
  readonly kind: "standalone" | "cumulative-stage";
};

type ResultRecord = {
  readonly taskId: string;
  readonly solverId: SolverId;
  readonly runId: string | null;
  readonly grade: number | null;
  readonly confidence: string | null;
  readonly summary: string | null;
  readonly verdictDetail: VerdictDetailRecord | null;
  readonly costUsd: number | null;
  readonly totalTokens: number | null;
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly cacheReadTokens: number | null;
  readonly durationSeconds: number | null;
  readonly totalToolCalls: number | null;
  readonly totalTurns: number | null;
  readonly sessionPath: string | null;
  readonly sessionBytes: number | null;
};

type SolverSummary = {
  readonly solverId: SolverId;
  readonly label: string;
  readonly shortLabel: string;
  readonly reasoning: string;
  readonly color: string;
  readonly logo: string;
  readonly completedRuns: number;
  readonly judgedRuns: number;
  readonly meanGrade: number | null;
  readonly gradePercent: number | null;
  readonly perfectGrades: number;
  readonly atLeastSix: number;
  readonly observedCostUsd: number;
  readonly averageObservedCostUsd: number | null;
  readonly totalTokens: number;
  readonly outputTokens: number;
  readonly toolCalls: number;
};

type Manifest = {
  readonly project: {
    readonly name: "UChile Bench";
    readonly tagline: string;
    readonly judgeId: string;
    readonly generatedAt: string;
    readonly githubUrl: string;
    readonly disclaimer: string;
  };
  readonly solvers: typeof SOLVERS;
  readonly targets: readonly TargetRecord[];
  readonly results: readonly ResultRecord[];
  readonly summaries: readonly SolverSummary[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8")) as unknown;

const optionalNumber = (record: Record<string, unknown>, key: string): number => {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const stringValue = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

const numberValue = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const booleanValue = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const recordsArray = (value: unknown): readonly Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : [];

const stringsArray = (value: unknown): readonly string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const walkFiles = (dir: string, fileName: string): readonly string[] => {
  const out: string[] = [];

  const visit = (current: string): void => {
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
      let stats;
      try {
        stats = statSync(path);
      } catch {
        continue;
      }

      if (stats.isDirectory()) {
        visit(path);
      } else if (entry === fileName) {
        out.push(path);
      }
    }
  };

  visit(dir);
  return out.sort((a, b) => a.localeCompare(b));
};

const parseTask = (
  taskJson: string,
  catalogRoot: string,
  kind: TargetRecord["kind"],
): TargetRecord | null => {
  const raw = readJson(taskJson);
  if (!isRecord(raw)) {
    return null;
  }

  const taskDir = taskJson.slice(0, -"task.json".length - 1);
  const taskId = relative(catalogRoot, taskDir);
  const title = typeof raw.title === "string" ? raw.title : taskId;
  return {
    taskId,
    course: taskId.split("/")[0] ?? taskId,
    title,
    kind,
  };
};

const discoverTargets = (): readonly TargetRecord[] => {
  const standaloneRoot = join(ROOT, "tasks", "standalone");
  const cumulativeRoot = join(ROOT, "tasks", "cumulative");
  return [
    ...walkFiles(standaloneRoot, "task.json")
      .map((taskJson) => parseTask(taskJson, standaloneRoot, "standalone")),
    ...walkFiles(cumulativeRoot, "task.json")
      .map((taskJson) => parseTask(taskJson, cumulativeRoot, "cumulative-stage")),
  ]
    .filter((target): target is TargetRecord => target !== null)
    .sort((a, b) => a.taskId.localeCompare(b.taskId));
};

const readSessionMetrics = (runDir: string): Partial<RunMetrics> => {
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
      totalToolCalls: optionalNumber(raw, "totalToolCalls"),
      totalTurns: optionalNumber(raw, "totalTurns"),
    };
  } catch {
    return {};
  }
};

const parseRun = (path: string): RunRecord | null => {
  const raw = readJson(path);
  if (!isRecord(raw)) {
    return null;
  }

  const taskId = raw.taskId;
  const runId = raw.runId;
  const agentId = raw.agentId;
  const status = raw.status;
  if (
    typeof taskId !== "string" ||
    typeof runId !== "string" ||
    typeof agentId !== "string" ||
    typeof status !== "string"
  ) {
    return null;
  }

  const runDir = path.slice(0, -"run.json".length - 1);
  const metricsRecord = isRecord(raw.metrics) ? raw.metrics : {};
  const sessionMetrics = readSessionMetrics(runDir);
  return {
    taskId,
    course: taskId.split("/")[0] ?? taskId,
    runId,
    agentId,
    status,
    finishedAt: typeof raw.finishedAt === "string" ? raw.finishedAt : "",
    runDir,
    metrics: {
      totalTokens: sessionMetrics.totalTokens ?? optionalNumber(metricsRecord, "totalTokens"),
      inputTokens: sessionMetrics.inputTokens ?? optionalNumber(metricsRecord, "inputTokens"),
      outputTokens: sessionMetrics.outputTokens ?? optionalNumber(metricsRecord, "outputTokens"),
      cacheReadTokens: sessionMetrics.cacheReadTokens ?? 0,
      costUsd: sessionMetrics.costUsd ?? optionalNumber(metricsRecord, "costUsd"),
      durationSeconds: sessionMetrics.durationSeconds ?? optionalNumber(raw, "durationSeconds"),
      totalToolCalls: sessionMetrics.totalToolCalls ?? optionalNumber(metricsRecord, "totalToolCalls"),
      totalTurns: sessionMetrics.totalTurns ?? 0,
    },
  };
};

const readRuns = (): readonly RunRecord[] =>
  walkFiles(join(ROOT, "runs"), "run.json")
    .map(parseRun)
    .filter((run): run is RunRecord => run !== null && run.status === "completed");

const latestRunFor = (
  runs: readonly RunRecord[],
  taskId: string,
  solverId: SolverId,
): RunRecord | null => {
  const matches = runs
    .filter((run) => run.taskId === taskId && run.agentId === solverId)
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
  return matches[0] ?? null;
};

const parseVerdict = (path: string): VerdictRecord | null => {
  const raw = readJson(path);
  if (!isRecord(raw)) {
    return null;
  }

  const grade = raw.grade;
  if (typeof grade !== "number" || !Number.isFinite(grade)) {
    return null;
  }

  const parseEvidence = (value: unknown): readonly VerdictEvidenceRecord[] =>
    recordsArray(value).flatMap((item) => {
      const evidencePath = stringValue(item.path);
      const description = stringValue(item.description);
      if (evidencePath === null || description === null) {
        return [];
      }
      return [{
        path: evidencePath,
        lines: stringValue(item.lines),
        description,
      }];
    });

  const parseDeductions = (value: unknown): readonly VerdictDeductionRecord[] =>
    recordsArray(value).flatMap((item) => {
      const id = stringValue(item.id);
      const rootCauseId = stringValue(item.rootCauseId);
      const origin = stringValue(item.origin);
      const points = numberValue(item.points);
      const reason = stringValue(item.reason);
      if (id === null || rootCauseId === null || origin === null || points === null || reason === null) {
        return [];
      }
      return [{
        id,
        rootCauseId,
        origin,
        points,
        reason,
        evidence: parseEvidence(item.evidence),
      }];
    });

  return {
    grade,
    confidence: typeof raw.confidence === "string" ? raw.confidence : "unknown",
    summary: typeof raw.summary === "string" ? raw.summary : "",
    detail: {
      criteria: recordsArray(raw.criteria).flatMap((item) => {
        const criterionId = stringValue(item.criterionId);
        const title = stringValue(item.title);
        const awardedPoints = numberValue(item.awardedPoints);
        const maximumPoints = numberValue(item.maximumPoints);
        const weight = numberValue(item.weight);
        const justification = stringValue(item.justification);
        if (
          criterionId === null ||
          title === null ||
          awardedPoints === null ||
          maximumPoints === null ||
          weight === null ||
          justification === null
        ) {
          return [];
        }
        return [{
          criterionId,
          title,
          awardedPoints,
          maximumPoints,
          weight,
          justification,
          evidence: parseEvidence(item.evidence),
          deductions: parseDeductions(item.deductions),
        }];
      }),
      gradeAdjustments: recordsArray(raw.gradeAdjustments).flatMap((item) => {
        const ruleId = stringValue(item.ruleId);
        const operation = stringValue(item.operation);
        const value = numberValue(item.value);
        const triggered = booleanValue(item.triggered);
        const justification = stringValue(item.justification);
        if (ruleId === null || operation === null || value === null || triggered === null || justification === null) {
          return [];
        }
        return [{
          ruleId,
          operation,
          value,
          triggered,
          justification,
          evidence: parseEvidence(item.evidence),
        }];
      }),
      commands: recordsArray(raw.commands).flatMap((item) => {
        const command = stringValue(item.command);
        const exitCode = numberValue(item.exitCode);
        const summary = stringValue(item.summary);
        if (command === null || summary === null) {
          return [];
        }
        return [{
          command,
          exitCode,
          summary,
        }];
      }),
      inheritedObservations: recordsArray(raw.inheritedObservations).flatMap((item) => {
        const id = stringValue(item.id);
        const description = stringValue(item.description);
        const effectOnCurrentAssignment = stringValue(item.effectOnCurrentAssignment);
        if (id === null || description === null || effectOnCurrentAssignment === null) {
          return [];
        }
        return [{
          id,
          description,
          effectOnCurrentAssignment,
          evidence: parseEvidence(item.evidence),
        }];
      }),
      criticalErrors: stringsArray(raw.criticalErrors),
      humanReviewItems: stringsArray(raw.humanReviewItems),
    },
  };
};

const latestVerdict = (run: RunRecord): VerdictRecord | null => {
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
};

const sessionFileName = (run: RunRecord): string =>
  `${run.taskId.replaceAll("/", "__")}__${run.agentId}__${run.runId}.json`;

const estimateDeepSeekUsageCost = (usage: UsageRecord): number => {
  const inputTokens = typeof usage.inputTokens === "number" && Number.isFinite(usage.inputTokens)
    ? usage.inputTokens
    : 0;
  const outputTokens = typeof usage.outputTokens === "number" && Number.isFinite(usage.outputTokens)
    ? usage.outputTokens
    : 0;
  const cacheReadTokens = typeof usage.cacheReadTokens === "number" && Number.isFinite(usage.cacheReadTokens)
    ? usage.cacheReadTokens
    : 0;
  const cacheMissInputTokens = Math.max(0, inputTokens - cacheReadTokens);
  return (
    (cacheMissInputTokens * DEEPSEEK_API_PRICING_PER_MILLION.inputCacheMiss) +
    (cacheReadTokens * DEEPSEEK_API_PRICING_PER_MILLION.inputCacheHit) +
    (outputTokens * DEEPSEEK_API_PRICING_PER_MILLION.output)
  ) / 1_000_000;
};

const applyPublishedSessionCost = (run: RunRecord, session: unknown): unknown => {
  if (run.agentId !== "pi-zen-deepseek-v4-flash-free-xhigh" || !isRecord(session)) {
    return session;
  }

  const turns = Array.isArray(session.turns) ? session.turns : [];
  for (const turn of turns) {
    if (!isRecord(turn) || !isRecord(turn.usage)) {
      continue;
    }
    turn.usage.costUsd = estimateDeepSeekUsageCost(turn.usage);
  }

  if (isRecord(session.metrics) && isRecord(session.metrics.usage)) {
    session.metrics.usage.costUsd = estimateApiCost(run);
  }

  return session;
};

const sanitizeSessionJson = (run: RunRecord, sourcePath: string, destinationPath: string): number => {
  const homeDir = process.env.HOME;
  const session = applyPublishedSessionCost(run, readJson(sourcePath));
  let content = `${JSON.stringify(session, null, 2)}\n`.replaceAll(ROOT, "<repo>");
  if (homeDir !== undefined) {
    content = content.replaceAll(homeDir, "<home>");
  }

  writeFileSync(destinationPath, content);
  return statSync(destinationPath).size;
};

const estimateApiCost = (run: RunRecord): number => {
  if (run.agentId !== "pi-zen-deepseek-v4-flash-free-xhigh") {
    return run.metrics.costUsd;
  }

  const cacheReadTokens = run.metrics.cacheReadTokens;
  const cacheMissInputTokens = Math.max(0, run.metrics.inputTokens - cacheReadTokens);
  return (
    (cacheMissInputTokens * DEEPSEEK_API_PRICING_PER_MILLION.inputCacheMiss) +
    (cacheReadTokens * DEEPSEEK_API_PRICING_PER_MILLION.inputCacheHit) +
    (run.metrics.outputTokens * DEEPSEEK_API_PRICING_PER_MILLION.output)
  ) / 1_000_000;
};

const buildResult = (
  run: RunRecord | null,
  taskId: string,
  solverId: SolverId,
): ResultRecord => {
  if (run === null) {
    return {
      taskId,
      solverId,
      runId: null,
      grade: null,
      confidence: null,
      summary: null,
      verdictDetail: null,
      costUsd: null,
      totalTokens: null,
      inputTokens: null,
      outputTokens: null,
      cacheReadTokens: null,
      durationSeconds: null,
      totalToolCalls: null,
      totalTurns: null,
      sessionPath: null,
      sessionBytes: null,
    };
  }

  const sessionSourcePath = join(run.runDir, "07-session", "session.compact.json");
  const sessionName = sessionFileName(run);
  const sessionDestinationPath = join(SESSION_DIR, sessionName);
  let sessionBytes: number | null = null;
  try {
    sessionBytes = sanitizeSessionJson(run, sessionSourcePath, sessionDestinationPath);
  } catch {
    sessionBytes = null;
  }

  const verdict = latestVerdict(run);
  return {
    taskId,
    solverId,
    runId: run.runId,
    grade: verdict?.grade ?? null,
    confidence: verdict?.confidence ?? null,
    summary: verdict?.summary ?? null,
    verdictDetail: verdict?.detail ?? null,
    costUsd: estimateApiCost(run),
    totalTokens: run.metrics.totalTokens,
    inputTokens: run.metrics.inputTokens,
    outputTokens: run.metrics.outputTokens,
    cacheReadTokens: run.metrics.cacheReadTokens,
    durationSeconds: run.metrics.durationSeconds,
    totalToolCalls: run.metrics.totalToolCalls,
    totalTurns: run.metrics.totalTurns,
    sessionPath: sessionBytes === null ? null : `data/sessions/${basename(sessionDestinationPath)}`,
    sessionBytes,
  };
};

const mean = (values: readonly number[]): number | null =>
  values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;

const summarizeSolver = (
  solver: (typeof SOLVERS)[number],
  results: readonly ResultRecord[],
): SolverSummary => {
  const solverResults = results.filter((result) => result.solverId === solver.id);
  const completed = solverResults.filter((result) => result.runId !== null);
  const judged = solverResults.filter((result) => result.grade !== null);
  const grades = judged
    .map((result) => result.grade)
    .filter((grade): grade is number => grade !== null);
  const observedCost = completed.reduce((sum, result) => sum + (result.costUsd ?? 0), 0);
  const meanGrade = mean(grades);
  return {
    solverId: solver.id,
    label: solver.label,
    shortLabel: solver.shortLabel,
    reasoning: solver.reasoning,
    color: solver.color,
    logo: solver.logo,
    completedRuns: completed.length,
    judgedRuns: judged.length,
    meanGrade,
    gradePercent: meanGrade === null ? null : (meanGrade / 7) * 100,
    perfectGrades: grades.filter((grade) => grade === 7).length,
    atLeastSix: grades.filter((grade) => grade >= 6).length,
    observedCostUsd: observedCost,
    averageObservedCostUsd: completed.length === 0 ? null : observedCost / completed.length,
    totalTokens: completed.reduce((sum, result) => sum + (result.totalTokens ?? 0), 0),
    outputTokens: completed.reduce((sum, result) => sum + (result.outputTokens ?? 0), 0),
    toolCalls: completed.reduce((sum, result) => sum + (result.totalToolCalls ?? 0), 0),
  };
};

rmSync(WEB_DATA_DIR, { recursive: true, force: true });
mkdirSync(SESSION_DIR, { recursive: true });

const targets = discoverTargets();
const runs = readRuns();
const results = targets.flatMap((target) =>
  SOLVERS.map((solver) => buildResult(
    latestRunFor(runs, target.taskId, solver.id),
    target.taskId,
    solver.id,
  ))
);
const summaries = SOLVERS.map((solver) => summarizeSolver(solver, results));

const manifest: Manifest = {
  project: {
    name: "UChile Bench",
    tagline: "Agentes de IA resolviendo tareas públicas del DCC UChile.",
    judgeId: JUDGE_ID,
    generatedAt: new Date().toISOString(),
    githubUrl: GITHUB_URL,
    disclaimer: "Proyecto independiente, no afiliado oficialmente a la Universidad de Chile ni al DCC.",
  },
  solvers: SOLVERS,
  targets,
  results,
  summaries,
};

writeFileSync(join(WEB_DATA_DIR, "manifest.json"), `${JSON.stringify(manifest)}\n`);
console.log(`Wrote ${relative(ROOT, join(WEB_DATA_DIR, "manifest.json"))}`);
console.log(`Copied ${results.filter((result) => result.sessionPath !== null).length} sessions`);

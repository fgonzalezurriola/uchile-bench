import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const JUDGE_ID = "pi-openai-gpt-5.5-medium-subscription";

const SOLVERS = [
  { id: "pi-minimax-m3-high-api", label: "MiniMax M3" },
  { id: "pi-zen-deepseek-v4-flash-free-xhigh", label: "DeepSeek V4 Flash" },
  { id: "pi-openai-gpt-5.4-mini-medium-subscription", label: "GPT 5.4 mini" },
] as const;

type SolverId = (typeof SOLVERS)[number]["id"];

type RunRecord = {
  readonly taskId: string;
  readonly agentId: string;
  readonly status: string;
  readonly finishedAt: string;
  readonly runDir: string;
};

type VerdictRecord = {
  readonly grade: number;
};

type Cell = {
  readonly text: string;
  readonly grade: number | null;
};

const useColor = process.stdout.isTTY && process.env.NO_COLOR === undefined;

const COURSE_COLORS: Readonly<Record<string, string>> = {
  CC3001: "\x1b[36m",
  CC3301: "\x1b[32m",
  CC3501: "\x1b[35m",
  CC4101: "\x1b[33m",
  CC4102: "\x1b[34m",
  CC4302: "\x1b[31m",
  CC4303: "\x1b[95m",
};

const reset = "\x1b[0m";

const courseOf = (taskId: string): string => taskId.split("/")[0] ?? taskId;

const colorCourse = (taskId: string, value: string): string => {
  if (!useColor) {
    return value;
  }

  const color = COURSE_COLORS[courseOf(taskId)];
  return color === undefined ? value : `${color}${value}${reset}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(path, "utf8")) as unknown;

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
      const stats = statSync(path);
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

const discoverTaskIds = (): readonly string[] => {
  const standaloneRoot = join(ROOT, "tasks", "standalone");
  const cumulativeRoot = join(ROOT, "tasks", "cumulative");
  const taskIds: string[] = [];

  for (const taskJson of walkFiles(standaloneRoot, "task.json")) {
    const taskDir = taskJson.slice(0, -"task.json".length - 1);
    taskIds.push(relative(standaloneRoot, taskDir));
  }

  for (const taskJson of walkFiles(cumulativeRoot, "task.json")) {
    const taskDir = taskJson.slice(0, -"task.json".length - 1);
    taskIds.push(relative(cumulativeRoot, taskDir));
  }

  return taskIds.sort((a, b) => a.localeCompare(b));
};

const parseRun = (path: string): RunRecord | null => {
  const raw = readJson(path);
  if (!isRecord(raw)) {
    return null;
  }

  const taskId = raw.taskId;
  const agentId = raw.agentId;
  const status = raw.status;
  if (typeof taskId !== "string" || typeof agentId !== "string" || typeof status !== "string") {
    return null;
  }

  return {
    taskId,
    agentId,
    status,
    finishedAt: typeof raw.finishedAt === "string" ? raw.finishedAt : "",
    runDir: path.slice(0, -"run.json".length - 1),
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
  return typeof grade === "number" && Number.isFinite(grade) ? { grade } : null;
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

const gradeCell = (run: RunRecord | null): Cell => {
  if (run === null) {
    return { text: "-", grade: null };
  }

  const verdict = latestVerdict(run);
  if (verdict === null) {
    return { text: "sin", grade: null };
  }

  return { text: verdict.grade.toFixed(1), grade: verdict.grade };
};

const mean = (grades: readonly number[]): number | null =>
  grades.length === 0
    ? null
    : grades.reduce((sum, grade) => sum + grade, 0) / grades.length;

const formatMean = (grades: readonly number[]): string => {
  const value = mean(grades);
  return value === null ? "-" : value.toFixed(2);
};

const pad = (value: string, width: number): string =>
  value.length >= width ? value : `${value}${" ".repeat(width - value.length)}`;

const runs = readRuns();
const rows = discoverTaskIds().map((taskId) => ({
  taskId,
  cells: SOLVERS.map((solver) => gradeCell(latestRunFor(runs, taskId, solver.id))),
}));

const widths = [
  Math.max("Target".length, ...rows.map((row) => row.taskId.length)),
  ...SOLVERS.map((solver, index) =>
    Math.max(
      solver.label.length,
      ...rows.map((row) => row.cells[index]?.text.length ?? 0),
    )
  ),
];

const header = [
  pad("Target", widths[0] ?? 0),
  ...SOLVERS.map((solver, index) => pad(solver.label, widths[index + 1] ?? 0)),
].join("  ");

console.log(`Judge: ${JUDGE_ID}`);
if (useColor) {
  const courses = [...new Set(rows.map((row) => courseOf(row.taskId)))];
  console.log(`Courses: ${courses.map((course) => colorCourse(course, course)).join("  ")}`);
}
console.log(header);
console.log(widths.map((width) => "-".repeat(width)).join("  "));

for (const row of rows) {
  const paddedTaskId = pad(row.taskId, widths[0] ?? 0);
  console.log([
    colorCourse(row.taskId, paddedTaskId),
    ...row.cells.map((cell, index) => pad(cell.text, widths[index + 1] ?? 0)),
  ].join("  "));
}

console.log("");
console.log("Summary");
console.log("Solver        Reviews  Mean  >=6.0  7.0");
console.log("------------  -------  ----  -----  ---");

for (const [index, solver] of SOLVERS.entries()) {
  const grades = rows
    .map((row) => row.cells[index]?.grade)
    .filter((grade): grade is number => grade !== null && grade !== undefined);
  const reviews = `${grades.length}/${rows.length}`;
  const passing = `${grades.filter((grade) => grade >= 6).length}/${grades.length}`;
  const perfect = `${grades.filter((grade) => grade === 7).length}/${grades.length}`;
  console.log([
    pad(solver.label, 12),
    pad(reviews, 7),
    pad(formatMean(grades), 4),
    pad(passing, 5),
    perfect,
  ].join("  "));
}

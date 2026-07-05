import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { useMemo, useState, Fragment } from "react";
import { marked } from "marked";

const renderMarkdown = (text: string): string => {
  if (!text) return "";
  try {
    return marked.parse(text) as string;
  } catch (e) {
    return text;
  }
};

type Solver = {
  readonly id: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly reasoning: string;
  readonly color: string;
  readonly logo?: string;
};

type Target = {
  readonly taskId: string;
  readonly course: string;
  readonly title: string;
  readonly kind: "standalone" | "cumulative-stage";
};

type VerdictEvidence = {
  readonly path: string;
  readonly lines: string | null;
  readonly description: string;
};

type VerdictDeduction = {
  readonly id: string;
  readonly rootCauseId: string;
  readonly origin: string;
  readonly points: number;
  readonly reason: string;
  readonly evidence: readonly VerdictEvidence[];
};

type VerdictCriterion = {
  readonly criterionId: string;
  readonly title: string;
  readonly awardedPoints: number;
  readonly maximumPoints: number;
  readonly weight: number;
  readonly justification: string;
  readonly evidence: readonly VerdictEvidence[];
  readonly deductions: readonly VerdictDeduction[];
};

type VerdictGradeAdjustment = {
  readonly ruleId: string;
  readonly operation: string;
  readonly value: number;
  readonly triggered: boolean;
  readonly justification: string;
  readonly evidence: readonly VerdictEvidence[];
};

type VerdictCommand = {
  readonly command: string;
  readonly exitCode: number | null;
  readonly summary: string;
};

type VerdictInheritedObservation = {
  readonly id: string;
  readonly description: string;
  readonly effectOnCurrentAssignment: string;
  readonly evidence: readonly VerdictEvidence[];
};

type VerdictDetail = {
  readonly criteria: readonly VerdictCriterion[];
  readonly gradeAdjustments: readonly VerdictGradeAdjustment[];
  readonly commands: readonly VerdictCommand[];
  readonly inheritedObservations: readonly VerdictInheritedObservation[];
  readonly criticalErrors: readonly string[];
  readonly humanReviewItems: readonly string[];
};

type Result = {
  readonly taskId: string;
  readonly solverId: string;
  readonly runId: string | null;
  readonly grade: number | null;
  readonly confidence: string | null;
  readonly summary: string | null;
  readonly verdictDetail: VerdictDetail | null;
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
  readonly solverId: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly reasoning: string;
  readonly color: string;
  readonly logo?: string;
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
    readonly name: string;
    readonly tagline: string;
    readonly judgeId: string;
    readonly generatedAt: string;
    readonly githubUrl: string;
    readonly disclaimer: string;
  };
  readonly solvers: readonly Solver[];
  readonly targets: readonly Target[];
  readonly results: readonly Result[];
  readonly summaries: readonly SolverSummary[];
};

type MainView = "resultados" | "sesiones";
type MetricTab = "notas" | "costo" | "tokens";

type ContentItem =
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "thinking"; readonly text: string }
  | {
      readonly type: "toolCall";
      readonly toolCall: {
        readonly id: string;
        readonly name: string;
        readonly arguments: Record<string, unknown>;
      };
    };

type SessionTurn = {
  readonly index?: number;
  readonly role?: string;
  readonly userText?: string;
  readonly assistantText?: string;
  readonly content?: readonly ContentItem[];
  readonly toolName?: string;
  readonly toolCallId?: string;
  readonly toolInput?: unknown;
  readonly toolOutput?: unknown;
  readonly toolResult?: string;
  readonly toolError?: boolean;
  readonly usage?: {
    readonly inputTokens?: number;
    readonly outputTokens?: number;
    readonly totalTokens?: number;
    readonly costUsd?: number;
  };
  readonly timestamp?: number;
};

type SessionData = {
  readonly schemaVersion?: number;
  readonly adapter?: string;
  readonly model?: string;
  readonly taskId?: string;
  readonly agentId?: string;
  readonly runId?: string;
  readonly startedAt?: string;
  readonly finishedAt?: string;
  readonly turns?: readonly SessionTurn[];
  readonly metrics?: {
    readonly totalTurns?: number;
    readonly totalToolCalls?: number;
    readonly toolCallBreakdown?: Record<string, number>;
    readonly usage?: {
      readonly costUsd?: number;
      readonly totalTokens?: number;
      readonly inputTokens?: number;
      readonly outputTokens?: number;
    };
    readonly durationSeconds?: number;
  };
};

const queryClient = new QueryClient();

const fetchJson = async <T,>(url: string): Promise<T> => {
  const absoluteUrl = url.startsWith("/") || url.startsWith("http") ? url : `/${url}`;
  const response = await fetch(absoluteUrl);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${absoluteUrl}`);
  }
  return await response.json() as T;
};

const fmtNumber = (value: number | null | undefined, digits: number): string =>
  value === null || value === undefined ? "-" : value.toFixed(digits);

const fmtUsd = (value: number | null | undefined): string =>
  value === null || value === undefined ? "-" : `$${value.toFixed(2)}`;

const fmtCompact = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "-";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(Math.round(value));
};

const fmtBytes = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "-";
  return `${(value / 1024).toFixed(0)} KB`;
};

const getResult = (
  manifest: Manifest,
  taskId: string,
  solverId: string,
): Result | undefined =>
  manifest.results.find((result) => result.taskId === taskId && result.solverId === solverId);

const gradeColor = (grade: number | null | undefined): string => {
  if (grade === null || grade === undefined) return "#171717";
  if (grade >= 7.0) return "#187A6B";
  if (grade >= 6.0) return "#2F7D4A";
  if (grade >= 5.0) return "#4D6B2A";
  if (grade >= 4.0) return "#6B4E16";
  return "#7F1D1D";
};

const gradeTextColor = (grade: number | null | undefined): string => {
  if (grade === null || grade === undefined) return "#8e8e8e";
  return "#ffffff";
};

const barPercent = (value: number, max: number): string =>
  `${max === 0 ? 0 : Math.max(3, (value / max) * 100)}%`;

function ModelName({
  label,
  reasoning,
  color,
  logo,
  loading = "eager",
}: {
  readonly label: string;
  readonly reasoning: string;
  readonly color: string;
  readonly logo?: string;
  readonly loading?: "lazy" | "eager";
}) {
  return (
    <span className="model-name">
      {logo ? (
        <img src={logo} alt="" className="model-logo" loading={loading} />
      ) : (
        <span className="dot" style={{ "--dot-color": color } as CSSProperties} />
      )}
      <span>{label}</span>
      <span className="reasoning">({reasoning})</span>
    </span>
  );
}

const fmtDuration = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined) return "-";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const buildToolResultMap = (
  turns: readonly SessionTurn[],
): Map<string, SessionTurn> => {
  const map = new Map<string, SessionTurn>();
  for (const turn of turns) {
    if (turn.role === "toolResult" && turn.toolCallId) {
      map.set(turn.toolCallId, turn);
    }
  }
  return map;
};

function SessionHeader({ session, result }: {
  readonly session: SessionData;
  readonly result?: Result;
}) {
  const m = session.metrics;
  return (
    <div className="session-header">
      <div className="session-header-title">
        <h3>
          {formatTaskId(session.taskId ?? result?.taskId ?? "")}
          <span className="muted" style={{ fontWeight: "normal", fontSize: "14px", marginLeft: "8px" }}>
            ({(session.taskId ?? result?.taskId ?? "").split("/")[0]})
          </span>
        </h3>
        {result?.grade !== null && result?.grade !== undefined ? (
          <span className="session-grade" style={{ background: gradeColor(result.grade), color: gradeTextColor(result.grade) }}>
            {result.grade.toFixed(1)}
          </span>
        ) : null}
      </div>
      <div className="session-meta">
        {session.model ? <span className="session-meta-item">{session.model}</span> : null}
        {session.adapter ? <span className="session-meta-item">{session.adapter}</span> : null}
        {m?.durationSeconds ? <span className="session-meta-item">{fmtDuration(m.durationSeconds)}</span> : null}
        {m?.usage?.costUsd ? <span className="session-meta-item">{fmtUsd(m.usage.costUsd)}</span> : null}
        {m?.totalToolCalls ? <span className="session-meta-item">{m.totalToolCalls} tool calls</span> : null}
        {m?.totalTurns ? <span className="session-meta-item">{m.totalTurns} turns</span> : null}
      </div>
      {m?.toolCallBreakdown ? (
        <div className="session-meta">
          {Object.entries(m.toolCallBreakdown).map(([name, count]) => (
            <span className="session-meta-item" key={name}>{name}: {count}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ThinkingBlock({ text }: { readonly text: string }) {
  return (
    <details className="thinking-block">
      <summary>Thinking ({fmtCompact(text.length)} chars)</summary>
      <pre className="thinking-content">{text}</pre>
    </details>
  );
}

function ToolCallBlock({ item, result }: {
  readonly item: ContentItem & { readonly type: "toolCall" };
  readonly result?: SessionTurn;
}) {
  const tc = item.toolCall;
  const isBash = tc.name === "bash";
  const command = isBash && typeof tc.arguments.command === "string" ? tc.arguments.command : null;
  const output = result?.toolResult ?? (typeof result?.toolOutput === "string" ? result.toolOutput : null);
  const isError = result?.toolError === true;

  return (
    <div className={isError ? "tool-call-block tool-error" : "tool-call-block"}>
      <div className="tool-call-header">
        <span className="tool-call-name">{tc.name}</span>
        {output ? <span className="tool-call-size">{fmtBytes(new Blob([output]).size)}</span> : null}
      </div>
      {command ? (
        <pre className="tool-call-command">$ {command}</pre>
      ) : (
        <details className="tool-call-args">
          <summary>Arguments</summary>
          <pre>{JSON.stringify(tc.arguments, null, 2)}</pre>
        </details>
      )}
      {output ? (
        output.length > 600 ? (
          <details className="tool-call-output">
            <summary>Output ({fmtBytes(new Blob([output]).size)})</summary>
            <pre>{output}</pre>
          </details>
        ) : (
          <pre className="tool-call-output-inline">{output}</pre>
        )
      ) : null}
    </div>
  );
}

function AssistantTurn({ turn, toolResultMap }: {
  readonly turn: SessionTurn;
  readonly toolResultMap: Map<string, SessionTurn>;
}) {
  const content = turn.content;
  if (!content || content.length === 0) {
    const text = turn.assistantText ?? JSON.stringify(turn, null, 2);
    return (
      <article className="turn turn-assistant">
        <div className="turn-role">assistant · #{turn.index ?? 0}</div>
        <div className="turn-text markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
      </article>
    );
  }
  return (
    <article className="turn turn-assistant">
      <div className="turn-role">
        assistant · #{turn.index ?? 0}
        {turn.usage?.costUsd ? <span className="turn-cost">{fmtUsd(turn.usage.costUsd)}</span> : null}
      </div>
      {content.map((item, i) => {
        if (item.type === "thinking") {
          return <ThinkingBlock key={i} text={item.text} />;
        }
        if (item.type === "toolCall") {
          const result = toolResultMap.get(item.toolCall.id);
          return <ToolCallBlock key={i} item={item} result={result} />;
        }
        return <div className="turn-text markdown-body" key={i} dangerouslySetInnerHTML={{ __html: renderMarkdown(item.text) }} />;
      })}
    </article>
  );
}

function UserTurn({ turn }: { readonly turn: SessionTurn }) {
  const text = turn.userText ?? JSON.stringify(turn, null, 2);
  return (
    <article className="turn turn-user">
      <div className="turn-role">user · #{turn.index ?? 0}</div>
      <div className="turn-text markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
    </article>
  );
}

function ScoreOverview({
  manifest,
}: {
  readonly manifest: Manifest;
}) {
  const maxPerfect = Math.max(1, ...manifest.summaries.map((summary) => summary.perfectGrades));
  return (
    <div className="overview-grid">
      {manifest.summaries.map((summary) => (
        <article className="model-summary" key={summary.solverId}>
          <div className="model-summary-head">
            <ModelName label={summary.shortLabel} reasoning={summary.reasoning} color={summary.color} logo={summary.logo} loading="eager" />
            <strong>{fmtNumber(summary.meanGrade, 2)}</strong>
          </div>
          <div className="bar-list">
            <div className="bar-row">
              <span>7.0</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: barPercent(summary.perfectGrades, maxPerfect), background: summary.color }} />
              </div>
              <b>{summary.perfectGrades}/{summary.judgedRuns}</b>
            </div>
            <div className="bar-row">
              <span>≥ 6.0</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: barPercent(summary.atLeastSix, summary.judgedRuns), background: summary.color }} />
              </div>
              <b>{summary.atLeastSix}/{summary.judgedRuns}</b>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

const formatTaskId = (taskId: string): string => {
  const parts = taskId.split("/");
  const lastPart = parts[parts.length - 1];
  if (lastPart && lastPart.startsWith("t")) {
    const num = parseInt(lastPart.slice(1), 10);
    if (!isNaN(num)) {
      return `Tarea ${num}`;
    }
  }
  return taskId;
};

const COURSE_NAMES: Record<string, string> = {
  CC3001: "CC3001 Algoritmos y Estructuras de Datos",
  CC3301: "CC3301 Programación de Software de Sistemas",
  CC3501: "CC3501 Modelación y Computación Gráfica",
  CC4101: "CC4101 Lenguajes de Programación",
  CC4102: "CC4102 Diseño y Análisis de Algoritmos",
  CC4302: "CC4302 Sistemas Operativos",
  CC4303: "CC4303 Redes",
};

function GradeHeatmap({ manifest }: { readonly manifest: Manifest }) {
  return (
    <div className="heatmap">
      <div className="heatmap-row heatmap-head">
        <div>Target</div>
        {manifest.solvers.map((solver) => (
          <div key={solver.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {solver.logo && <img src={solver.logo} className="model-logo" alt="" style={{ width: "14px", height: "14px" }} loading="eager" />}
            <div>
              {solver.shortLabel} <span className="reasoning">({solver.reasoning})</span>
            </div>
          </div>
        ))}
      </div>
      {manifest.targets.map((target, index) => {
        const previous = manifest.targets[index - 1];
        const startsCourse = previous === undefined || previous.course !== target.course;
        return (
          <Fragment key={target.taskId}>
            {startsCourse ? (
              <div className={index === 0 ? "heatmap-course-header first" : "heatmap-course-header"}>
                {COURSE_NAMES[target.course] ?? target.course}
              </div>
            ) : null}
            <div className="heatmap-row" key={target.taskId}>
              <div className="heatmap-target">
                <span>{formatTaskId(target.taskId)}</span>
              </div>
              {manifest.solvers.map((solver) => {
                const result = getResult(manifest, target.taskId, solver.id);
                return (
                  <div
                    className="grade-cell"
                    key={solver.id}
                    style={{
                      background: gradeColor(result?.grade),
                      color: gradeTextColor(result?.grade),
                    }}
                    title={`${target.taskId} · ${solver.shortLabel}: ${result?.grade?.toFixed(1) ?? "sin nota"}`}
                  >
                    {result?.grade?.toFixed(1) ?? "sin"}
                  </div>
                );
              })}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

function CostView({ manifest }: { readonly manifest: Manifest }) {
  const maxCost = Math.max(1, ...manifest.summaries.map((summary) => summary.observedCostUsd));
  return (
    <div className="metric-panel">
      {manifest.summaries.map((summary) => (
        <article className="wide-metric" key={summary.solverId}>
          <div className="wide-metric-label">
            <ModelName label={summary.label} reasoning={summary.reasoning} color={summary.color} logo={summary.logo} loading="lazy" />
            <strong>{fmtUsd(summary.observedCostUsd)}</strong>
          </div>
          <div className="bar-track tall">
            <div className="bar-fill" style={{ width: barPercent(summary.observedCostUsd, maxCost), background: summary.color }} />
          </div>
          <div className="metric-foot">
            <span>costo/tarea {fmtUsd(summary.averageObservedCostUsd)}</span>
            <span>nota promedio {fmtNumber(summary.meanGrade, 2)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function TokensView({ manifest }: { readonly manifest: Manifest }) {
  const maxTokens = Math.max(1, ...manifest.summaries.map((summary) => summary.totalTokens));
  const maxTools = Math.max(1, ...manifest.summaries.map((summary) => summary.toolCalls));
  return (
    <div className="metric-panel two-col">
      {manifest.summaries.map((summary) => (
        <article className="wide-metric" key={summary.solverId}>
          <div className="wide-metric-label">
            <span className="model-name">
              {summary.logo ? (
                <img src={summary.logo} alt="" className="model-logo" loading="lazy" />
              ) : (
                <span className="dot" style={{ "--dot-color": summary.color } as CSSProperties} />
              )}
              <span>{summary.shortLabel}</span>
            </span>
            <strong className="tokens-total">{fmtCompact(summary.totalTokens)} tokens</strong>
          </div>
          <div className="bar-row stacked">
            <span>Total tokens</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: barPercent(summary.totalTokens, maxTokens), background: summary.color }} />
            </div>
          </div>
          <div className="bar-row stacked">
            <span>Output tokens</span>
            <div className="bar-track">
              <div className="bar-fill muted-fill" style={{ width: barPercent(summary.outputTokens, maxTokens) }} />
            </div>
          </div>
          <div className="bar-row stacked">
            <span>Tool calls</span>
            <div className="bar-track">
              <div className="bar-fill muted-fill" style={{ width: barPercent(summary.toolCalls, maxTools) }} />
            </div>
            <b className="fixed-count">{summary.toolCalls.toLocaleString("en-US")}</b>
          </div>
        </article>
      ))}
    </div>
  );
}

function ResultsView({ manifest }: { readonly manifest: Manifest }) {
  const [metricTab, setMetricTab] = useState<MetricTab>("notas");

  return (
    <section className="section">
      <div className="section-header">
        <div className="section-title">
          <h3>Leaderboard</h3>
          <span>{manifest.targets.length} tareas</span>
        </div>
        <div className="tabs">
          {(["notas", "costo", "tokens"] as const).map((tab) => (
            <button
              key={tab}
              className={metricTab === tab ? "tab active" : "tab"}
              type="button"
              onClick={() => setMetricTab(tab)}
            >
              {tab === "notas" ? "Notas" : tab === "costo" ? "Costo" : "Tokens"}
            </button>
          ))}
        </div>
      </div>
      {metricTab === "notas" ? (
        <>
          <ScoreOverview manifest={manifest} />
          <GradeHeatmap manifest={manifest} />
        </>
      ) : metricTab === "costo" ? (
        <CostView manifest={manifest} />
      ) : (
        <TokensView manifest={manifest} />
      )}
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Modelo</th>
            <th className="numeric">Reviews</th>
            <th className="numeric">Nota promedio</th>
            <th className="numeric">≥ 6.0</th>
            <th className="numeric">7.0</th>
            <th className="numeric">Costo</th>
            <th className="numeric">Tokens</th>
          </tr>
        </thead>
        <tbody>
          {manifest.summaries.map((summary) => (
            <tr key={summary.solverId}>
              <td>
                <ModelName label={summary.label} reasoning={summary.reasoning} color={summary.color} logo={summary.logo} loading="lazy" />
              </td>
              <td className="numeric">{summary.judgedRuns}/{manifest.targets.length}</td>
              <td className="numeric">{fmtNumber(summary.meanGrade, 2)}</td>
              <td className="numeric">{summary.atLeastSix}/{summary.judgedRuns}</td>
              <td className="numeric">{summary.perfectGrades}/{summary.judgedRuns}</td>
              <td className="numeric">{fmtUsd(summary.observedCostUsd)}</td>
              <td className="numeric">{fmtCompact(summary.totalTokens)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SessionConversation({ session, result }: {
  readonly session: SessionData;
  readonly result?: Result;
}) {
  const toolResultMap = useMemo(
    () => buildToolResultMap(session.turns ?? []),
    [session.turns],
  );
  const visibleTurns = useMemo(
    () => (session.turns ?? []).filter((t) => t.role !== "toolResult"),
    [session.turns],
  );

  return (
    <>
      <SessionHeader session={session} result={result} />
      <div className="session-scroll">
        {result?.summary ? (
          <article className="turn turn-verdict">
            <div className="turn-role">
              Justificación de la nota · evaluación por juez AI
              {result.confidence ? <span className="turn-cost" style={{ marginLeft: "8px" }}>· Confianza: {result.confidence}</span> : null}
            </div>
            <div className="turn-text markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(result.summary) }} />
          </article>
        ) : null}
        <div className="turn-list">
          {visibleTurns.map((turn, i) => {
            if (turn.role === "user") {
              return <UserTurn key={`${turn.index ?? i}-user`} turn={turn} />;
            }
            if (turn.role === "assistant") {
              return <AssistantTurn key={`${turn.index ?? i}-assistant`} turn={turn} toolResultMap={toolResultMap} />;
            }
            return (
              <article className="turn" key={`${turn.index ?? i}-${turn.role ?? "turn"}`}>
                <div className="turn-role">{turn.role ?? "turn"} · #{turn.index ?? i}</div>
                <pre className="turn-text">{JSON.stringify(turn, null, 2)}</pre>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}

function EvidenceList({ evidence }: { readonly evidence: readonly VerdictEvidence[] }) {
  if (evidence.length === 0) return null;
  return (
    <ul className="verdict-evidence-list">
      {evidence.map((item, index) => (
        <li key={`${item.path}-${item.lines ?? "all"}-${index}`}>
          <span className="verdict-evidence-path">
            {item.path}{item.lines ? `:${item.lines}` : ""}
          </span>
          <span>{item.description}</span>
        </li>
      ))}
    </ul>
  );
}

function VerdictDetailView({ detail }: { readonly detail: VerdictDetail }) {
  const triggeredAdjustments = detail.gradeAdjustments.filter((adjustment) => adjustment.triggered);
  return (
    <div className="verdict-detail">
      {detail.criticalErrors.length > 0 ? (
        <section className="verdict-section verdict-alert">
          <h4>Errores críticos</h4>
          <ul>
            {detail.criticalErrors.map((error, index) => <li key={index}>{error}</li>)}
          </ul>
        </section>
      ) : null}

      <section className="verdict-section">
        <h4>Criterios</h4>
        <div className="verdict-criteria">
          {detail.criteria.map((criterion) => (
            <article className="verdict-criterion" key={criterion.criterionId}>
              <div className="verdict-criterion-head">
                <div>
                  <strong>{criterion.criterionId} · {criterion.title}</strong>
                  <span>{Math.round(criterion.weight * 100)}% del puntaje</span>
                </div>
                <b>{criterion.awardedPoints}/{criterion.maximumPoints}</b>
              </div>
              <p>{criterion.justification}</p>
              <EvidenceList evidence={criterion.evidence} />
              {criterion.deductions.length > 0 ? (
                <div className="verdict-deductions">
                  {criterion.deductions.map((deduction) => (
                    <details key={deduction.id}>
                      <summary>
                        Descuento {deduction.points}: {deduction.reason}
                      </summary>
                      <p>Root cause: {deduction.rootCauseId} · origen: {deduction.origin}</p>
                      <EvidenceList evidence={deduction.evidence} />
                    </details>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {triggeredAdjustments.length > 0 ? (
        <section className="verdict-section">
          <h4>Ajustes de nota aplicados</h4>
          {triggeredAdjustments.map((adjustment) => (
            <article className="verdict-criterion" key={adjustment.ruleId}>
              <div className="verdict-criterion-head">
                <strong>{adjustment.ruleId}</strong>
                <b>{adjustment.operation} {adjustment.value}</b>
              </div>
              <p>{adjustment.justification}</p>
              <EvidenceList evidence={adjustment.evidence} />
            </article>
          ))}
        </section>
      ) : null}

      {detail.inheritedObservations.length > 0 ? (
        <section className="verdict-section">
          <h4>Observaciones heredadas</h4>
          {detail.inheritedObservations.map((observation) => (
            <article className="verdict-criterion" key={observation.id}>
              <strong>{observation.id}</strong>
              <p>{observation.description}</p>
              <p>{observation.effectOnCurrentAssignment}</p>
              <EvidenceList evidence={observation.evidence} />
            </article>
          ))}
        </section>
      ) : null}

      {detail.commands.length > 0 ? (
        <section className="verdict-section">
          <h4>Comandos del juez</h4>
          <div className="verdict-command-list">
            {detail.commands.map((command, index) => (
              <details key={`${command.command}-${index}`}>
                <summary>{command.summary} {command.exitCode === null ? "" : `(exit ${command.exitCode})`}</summary>
                <pre>{command.command}</pre>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {detail.humanReviewItems.length > 0 ? (
        <section className="verdict-section">
          <h4>Para revisión humana</h4>
          <ul>
            {detail.humanReviewItems.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function SessionJudgeView({ session, result }: {
  readonly session: SessionData;
  readonly result?: Result;
}) {
  return (
    <>
      <SessionHeader session={session} result={result} />
      <div className="session-scroll">
        {result?.summary ? (
          <article className="turn turn-verdict-full">
            <div className="turn-role">
              Evaluación detallada del Juez AI ({result.solverId})
              {result.confidence ? <span className="turn-cost" style={{ marginLeft: "8px" }}>· Confianza: {result.confidence}</span> : null}
            </div>
            <div className="turn-text markdown-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(result.summary) }} />
            {result.verdictDetail ? <VerdictDetailView detail={result.verdictDetail} /> : null}
          </article>
        ) : (
          <div className="empty">Esta sesión no cuenta con una justificación del juez detallada.</div>
        )}
      </div>
    </>
  );
}

function SessionsView({ manifest }: { readonly manifest: Manifest }) {
  const courses = useMemo(() => {
    const set = new Set(manifest.targets.map((t) => t.course));
    return Array.from(set).sort();
  }, [manifest.targets]);

  const [selectedCourse, setSelectedCourse] = useState<string>(() => {
    const hasCC3001 = manifest.targets.some((t) => t.course === "CC3001");
    return hasCC3001 ? "CC3001" : (manifest.targets[0]?.course ?? "");
  });

  const [solverId, setSolverId] = useState<string>(manifest.solvers[0]?.id ?? "");
  const [viewMode, setViewMode] = useState<"agente" | "juez">("agente");

  const sessions = useMemo(() => {
    return manifest.results.filter((result) =>
      result.solverId === solverId &&
      result.sessionPath !== null &&
      result.taskId.startsWith(selectedCourse)
    );
  }, [manifest.results, solverId, selectedCourse]);

  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const currentSessionsJson = JSON.stringify(sessions.map((s) => s.sessionPath));
  useMemo(() => {
    if (sessions.length > 0) {
      const stillExists = sessions.some((s) => s.sessionPath === selectedPath);
      if (!stillExists) {
        setSelectedPath(sessions[0].sessionPath);
      }
    } else {
      setSelectedPath(null);
    }
  }, [currentSessionsJson]);

  const selected = sessions.find((session) => session.sessionPath === selectedPath) ?? sessions[0];
  const queryClient = useQueryClient();

  const prefetchSession = (sessionPath: string | null) => {
    if (!sessionPath) return;
    queryClient.prefetchQuery({
      queryKey: ["session", sessionPath],
      queryFn: () => fetchJson<SessionData>(sessionPath),
      staleTime: 5 * 60 * 1000,
    });
  };

  const sessionQuery = useQuery({
    queryKey: ["session", selected?.sessionPath],
    queryFn: () => fetchJson<SessionData>(selected?.sessionPath ?? ""),
    enabled: selected?.sessionPath !== undefined && selected.sessionPath !== null,
  });

  return (
    <section className="section section-sessions">
      <div className="sessions-toolbar">
        <div className="sessions-toolbar-title">
          <strong>Sesiones</strong>
          <span>{COURSE_NAMES[selectedCourse] ?? selectedCourse}</span>
        </div>
        <div className="toolbar-filters">
          <div className="filter-group">
            <label htmlFor="course-select">Curso:</label>
            <select
              id="course-select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="toolbar-select"
            >
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <div className="view-mode-buttons">
              <button
                className={viewMode === "agente" ? "view-mode-button active" : "view-mode-button"}
                type="button"
                onClick={() => setViewMode("agente")}
              >
                Agente
              </button>
              <button
                className={viewMode === "juez" ? "view-mode-button active" : "view-mode-button"}
                type="button"
                onClick={() => setViewMode("juez")}
              >
                Juez
              </button>
            </div>
          </div>

          <div className="model-buttons">
            {manifest.solvers.map((solver) => (
              <button
                key={solver.id}
                className={solverId === solver.id ? "model-button active" : "model-button"}
                type="button"
                onClick={() => setSolverId(solver.id)}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  {solver.logo && <img src={solver.logo} className="model-logo" alt="" style={{ width: "14px", height: "14px" }} loading="lazy" />}
                  <span>{solver.shortLabel}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <span className="sessions-count">{sessions.length} sesiones</span>
      </div>
      <div className="session-layout">
        <div className="session-list">
          {sessions.map((session) => (
            <button
              key={`${session.taskId}-${session.runId}`}
              className={selected?.sessionPath === session.sessionPath ? "session-card active" : "session-card"}
              type="button"
              onClick={() => setSelectedPath(session.sessionPath)}
              onMouseEnter={() => prefetchSession(session.sessionPath)}
              onFocus={() => prefetchSession(session.sessionPath)}
            >
              <div className="session-card-top">
                <strong>
                  {formatTaskId(session.taskId)}
                  <span className="muted" style={{ fontWeight: "normal", fontSize: "11px", marginLeft: "6px" }}>
                    ({session.taskId.split("/")[0]})
                  </span>
                </strong>
                {session.grade !== null ? (
                  <span className="session-card-grade" style={{ background: gradeColor(session.grade), color: gradeTextColor(session.grade) }}>
                    {session.grade.toFixed(1)}
                  </span>
                ) : null}
              </div>
              <span className="muted">
                {fmtBytes(session.sessionBytes)}
                {session.totalTurns ? ` · ${session.totalTurns} turns` : ""}
                {session.totalToolCalls ? ` · ${session.totalToolCalls} tools` : ""}
              </span>
            </button>
          ))}
          {sessions.length === 0 ? <div className="empty">No hay sesiones para este filtro.</div> : null}
        </div>
        <div className="session-viewer">
          {selectedPath === null ? <div className="empty">Selecciona una sesión de la lista para comenzar.</div> : null}
          {selectedPath !== null && sessionQuery.isLoading ? <div className="empty">Cargando sesión...</div> : null}
          {selectedPath !== null && sessionQuery.isError ? <div className="empty">No se pudo cargar la sesión.</div> : null}
          {selectedPath !== null && sessionQuery.data !== undefined ? (
            viewMode === "agente" ? (
              <SessionConversation session={sessionQuery.data} result={selected} />
            ) : (
              <SessionJudgeView session={sessionQuery.data} result={selected} />
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AppContent() {
  const [view, setView] = useState<MainView>("resultados");
  const manifestQuery = useQuery({
    queryKey: ["manifest"],
    queryFn: () => fetchJson<Manifest>("/data/manifest.json"),
  });

  if (manifestQuery.isLoading) {
    return <main className="page"><div className="empty">Cargando UChile Bench...</div></main>;
  }

  if (manifestQuery.isError || manifestQuery.data === undefined) {
    return (
      <main className="page">
        <div className="empty" style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ margin: "0 0 12px", color: "#f87171" }}>No se pudo cargar el manifest de datos.</p>
          <button
            type="button"
            onClick={() => void manifestQuery.refetch()}
            style={{
              padding: "8px 16px",
              background: "#151515",
              border: "1px solid #2c2c2c",
              color: "#d7d7d7",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            Reintentar carga
          </button>
        </div>
      </main>
    );
  }

  const manifest = manifestQuery.data;
  const reviewed = manifest.summaries.reduce((sum, summary) => sum + summary.judgedRuns, 0);

  return (
    <main className={view === "sesiones" ? "page page-sessions" : "page"}>
      <header className="topbar">
        <div className="brand">
          <img src="/logos/logo.svg" alt="UCH Logo" className="brand-logo" loading="eager" />
          <h1>{manifest.project.name}</h1>
        </div>
        <nav className="nav" aria-label="Navegación">
          <button className={view === "resultados" ? "active" : ""} type="button" onClick={() => setView("resultados")}>Resultados</button>
          <button className={view === "sesiones" ? "active" : ""} type="button" onClick={() => setView("sesiones")}>Sesiones</button>
          <a href={manifest.project.githubUrl} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            <span>GitHub</span>
          </a>
        </nav>
      </header>

      {view === "resultados" ? (
        <section className="hero">
          <div className="hero-copy">
            <h2>Agentes de IA contra tareas del DCC.</h2>
            <p>Minimax M3, Deepseek V4 Flash y GPT 5.4 Mini contra tareas de código de la carrera de Ingenieria Civil en Computación</p>
          </div>
          <div className="stats">
            <div className="stat"><strong>{manifest.targets.length}</strong><span>tareas</span></div>
            <div className="stat"><strong>{manifest.solvers.length}</strong><span>modelos</span></div>
            <div className="stat"><strong>{new Set(manifest.targets.map((target) => target.course)).size}</strong><span>cursos</span></div>
            <div className="stat"><strong>{reviewed}</strong><span>reviews</span></div>
          </div>
        </section>
      ) : null}

      {view === "resultados" ? <ResultsView manifest={manifest} /> : <SessionsView manifest={manifest} />}

      {view === "resultados" ? <footer className="footer">
        <p>Datos generados desde runs locales. Las runs pesan cerca de 20gb por lo que es díficil publicarlas.</p>
        <p>{manifest.project.disclaimer}</p>
        <a className="footer-github" href={manifest.project.githubUrl} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
          </svg>
          <span>Código en GitHub</span>
        </a>
      </footer> : null}
    </main>
  );
}

export default function BenchApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

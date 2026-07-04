import { Context, DateTime, Effect, Layer, Option } from "effect"
import path from "node:path"
import { normalizePiSessionFile } from "../adapters/pi/PiSessionNormalizer.js"
import { EvidenceFile, SessionFile } from "../domain/Evidence.js"
import { SessionCompactionError, type FileSystemError } from "../domain/Errors.js"
import type { Run } from "../domain/Run.js"
import type {
  AgentEventNormalization,
  AgentSession,
  SessionMetrics,
  SessionRetry,
  SessionTokenUsage,
  SessionTurn,
} from "../domain/Session.js"
import { FileSystemService } from "./FileSystemService.js"

const DEFAULT_HTML_MAX_BYTES = 5 * 1024 * 1024
const DEFAULT_TOOL_RESULT_MAX_BYTES = 64 * 1024

export interface SessionSourceMetadata {
  readonly adapter: string
  readonly model: string
  readonly runId: string
  readonly taskId: string
  readonly agentId: string
  readonly startedAt: string | null
  readonly finishedAt: string | null
  readonly prompt: string
  readonly eventSource: string
}

export interface PublishedSession {
  readonly session: AgentSession
  readonly htmlGenerated: boolean
  readonly compactBytes: number
  readonly htmlBytes: number
  readonly htmlSkippedReason?: "compact-json-size-limit" | "html-size-limit"
}

export interface SessionService {
  readonly createAndSave: (
    run: Run,
    evidenceDir: string,
    sessionDir: string,
    prompt: string,
  ) => Effect.Effect<AgentSession, FileSystemError | SessionCompactionError>
  readonly createAndSaveFromFile: (
    metadata: SessionSourceMetadata,
    rawEventsPath: string,
    sessionDir: string,
  ) => Effect.Effect<PublishedSession, FileSystemError | SessionCompactionError>
}

export const SessionService = Context.Service<SessionService>("SessionService")

const computeDurationSeconds = (
  startedAt: string | null,
  finishedAt: string | null,
): number | null => {
  if (startedAt === null || finishedAt === null) return null
  const start = DateTime.make(startedAt)
  const finish = DateTime.make(finishedAt)
  if (Option.isNone(start) || Option.isNone(finish)) return null
  return (
    DateTime.toEpochMillis(finish.value) - DateTime.toEpochMillis(start.value)
  ) / 1000
}

export const computeSessionMetrics = (
  turns: ReadonlyArray<SessionTurn>,
  totalUsage: SessionTokenUsage,
  startedAt: string | null,
  finishedAt: string | null,
  retries: ReadonlyArray<SessionRetry> = [],
): SessionMetrics => {
  let totalToolCalls = 0
  const toolCallBreakdown: Record<string, number> = {}
  let totalThinkingChars = 0
  let totalOutputChars = 0
  let totalErrors = 0
  let toolOutputOriginalBytes = 0
  let toolOutputRetainedBytes = 0

  for (const turn of turns) {
    if (turn.error !== undefined || turn.toolError === true) totalErrors += 1
    if (turn.role === "toolResult") {
      const retainedBytes = Buffer.byteLength(turn.toolResult ?? "", "utf8")
      toolOutputRetainedBytes += retainedBytes
      toolOutputOriginalBytes += turn.toolResultTruncation?.originalBytes ?? retainedBytes
    }
    if (turn.role !== "assistant" || turn.content === undefined) continue
    for (const block of turn.content) {
      if (block.type === "thinking") {
        totalThinkingChars += block.text.length
      } else if (block.type === "text") {
        totalOutputChars += block.text.length
      } else {
        totalToolCalls += 1
        const name = block.toolCall.name
        toolCallBreakdown[name] = (toolCallBreakdown[name] ?? 0) + 1
      }
    }
  }

  return {
    totalTurns: turns.filter((turn) => turn.role === "assistant").length,
    totalToolCalls,
    toolCallBreakdown,
    totalThinkingChars,
    totalOutputChars,
    totalErrors,
    totalRetries: retries.length,
    toolOutputOriginalBytes,
    toolOutputRetainedBytes,
    usage: totalUsage,
    durationSeconds: computeDurationSeconds(startedAt, finishedAt),
  }
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

const formatNumber = (value: number): string => value.toLocaleString("en-US")

const renderTurnHtml = (turn: SessionTurn): string => {
  if (turn.role === "user") {
    const attachments = turn.attachments === undefined || turn.attachments.length === 0
      ? ""
      : `<div class="attachments">Attachments: ${escapeHtml(turn.attachments.map((item) => item.name ?? item.mimeType ?? item.type).join(", "))}</div>`
    return `<article class="turn user"><header>User</header><pre>${escapeHtml(turn.userText ?? "")}</pre>${attachments}</article>`
  }

  if (turn.role === "toolResult") {
    const truncation = turn.toolResultTruncation === undefined
      ? ""
      : `<p class="truncation">Truncated: ${formatNumber(turn.toolResultTruncation.retainedBytes)} of ${formatNumber(turn.toolResultTruncation.originalBytes)} bytes retained.</p>`
    return `<article class="turn tool tool-result"><details><summary>${escapeHtml(turn.toolName ?? "tool")} result${turn.toolError === true ? " · error" : ""}</summary>${truncation}<pre>${escapeHtml(turn.toolResult ?? "")}</pre></details></article>`
  }

  const error = turn.error === undefined
    ? ""
    : `<div class="error">${escapeHtml(turn.error.message)}</div>`
  const usage = turn.usage === undefined
    ? ""
    : `<span class="usage">${formatNumber(turn.usage.inputTokens)} in · ${formatNumber(turn.usage.outputTokens)} out · ${formatNumber(turn.usage.totalTokens)} total${turn.usage.costUsd === undefined ? "" : ` · $${turn.usage.costUsd.toFixed(4)}`}</span>`
  const blocks = (turn.content ?? []).map((block) => {
    if (block.type === "thinking") {
      return `<details class="thinking"><summary>Thinking</summary><pre>${escapeHtml(block.text)}</pre></details>`
    }
    if (block.type === "text") return `<div class="assistant-text"><pre>${escapeHtml(block.text)}</pre></div>`
    return `<details class="tool tool-call"><summary>Tool call · ${escapeHtml(block.toolCall.name)}</summary><pre>${escapeHtml(JSON.stringify(block.toolCall.arguments, null, 2))}</pre></details>`
  }).join("")
  return `<article class="turn assistant"><header>Assistant ${usage}</header>${error}${blocks}</article>`
}

export const renderSessionHtml = (session: AgentSession): string => {
  const metrics = session.metrics
  const retries = session.retries.length === 0
    ? ""
    : `<details class="retries"><summary>${session.retries.length} retries</summary><pre>${escapeHtml(JSON.stringify(session.retries, null, 2))}</pre></details>`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(session.runId)} · compact session</title>
<style>
:root{color-scheme:light dark;font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.45}body{margin:0;background:#111318;color:#e8eaf0}.shell{max-width:1100px;margin:auto;padding:24px}.top{position:sticky;top:0;z-index:2;background:#111318ee;backdrop-filter:blur(8px);padding:12px 0}.title{font-size:1.25rem;font-weight:700}.meta,.usage,.attachments,.truncation{color:#aeb5c5;font-size:.85rem}.controls{display:flex;gap:18px;margin-top:12px}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:18px 0}.metric,.turn,.retries{border:1px solid #343a48;border-radius:10px;background:#1a1e27}.metric{padding:12px}.metric strong{display:block;font-size:1.2rem}.turn{margin:12px 0;padding:14px}.turn header{font-weight:700;margin-bottom:10px;display:flex;justify-content:space-between;gap:12px}.user{border-left:4px solid #6587ff}.assistant{border-left:4px solid #65d1a4}.tool{border-left:4px solid #d5a95d}.error{background:#4d2028;padding:10px;border-radius:6px;margin-bottom:10px}details{margin:8px 0}summary{cursor:pointer;font-weight:600}pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0 0;font:13px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}.hidden{display:none!important}
</style>
</head>
<body><main class="shell">
<section class="top"><div class="title">${escapeHtml(session.runId)}</div><div class="meta">${escapeHtml(session.taskId)} · ${escapeHtml(session.agentId)} · ${escapeHtml(session.model)}</div><div class="controls"><label><input id="thinking-toggle" type="checkbox" checked> Thinking</label><label><input id="tools-toggle" type="checkbox" checked> Tools</label></div></section>
<section class="metrics">
<div class="metric"><strong>${formatNumber(metrics.totalTurns)}</strong>assistant turns</div>
<div class="metric"><strong>${formatNumber(metrics.totalToolCalls)}</strong>tool calls</div>
<div class="metric"><strong>${formatNumber(metrics.usage.totalTokens)}</strong>tokens</div>
<div class="metric"><strong>${formatNumber(metrics.totalRetries)}</strong>retries</div>
<div class="metric"><strong>${formatNumber(metrics.totalErrors)}</strong>errors</div>
<div class="metric"><strong>${metrics.usage.costUsd === undefined ? "—" : `$${metrics.usage.costUsd.toFixed(4)}`}</strong>cost</div>
</section>
${retries}
<section class="timeline">${session.turns.map(renderTurnHtml).join("\n")}</section>
</main>
<script>
const bind=(id,selector)=>document.getElementById(id).addEventListener('change',event=>document.querySelectorAll(selector).forEach(node=>node.classList.toggle('hidden',!event.target.checked)));
bind('thinking-toggle','.thinking');bind('tools-toggle','.tool');
</script></body></html>\n`
}

/** Legacy on-demand text rendering; compact JSON and HTML are the retained files. */
export const renderSessionMarkdown = (session: AgentSession): string => {
  const lines = [`# Session: ${session.runId}`, "", `- Task: ${session.taskId}`, `- Agent: ${session.agentId}`, "", "## Turns", ""]
  for (const turn of session.turns) {
    if (turn.role === "user") lines.push("### User", "", turn.userText ?? "", "")
    else if (turn.role === "toolResult") lines.push(`### Tool result: ${turn.toolName ?? "unknown"}`, "", turn.toolResult ?? "", "")
    else {
      lines.push("### Assistant", "")
      for (const block of turn.content ?? []) {
        lines.push(block.type === "toolCall" ? `Tool: ${block.toolCall.name}` : block.text, "")
      }
    }
  }
  return lines.join("\n")
}

const configuredPositiveInteger = (name: string, fallback: number): number => {
  const value = process.env[name]
  if (value === undefined) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

export const makeCompactSession = (
  metadata: SessionSourceMetadata,
  normalization: AgentEventNormalization,
): AgentSession => ({
  schemaVersion: 2,
  adapter: metadata.adapter,
  model: metadata.model,
  runId: metadata.runId,
  taskId: metadata.taskId,
  agentId: metadata.agentId,
  startedAt: metadata.startedAt,
  finishedAt: metadata.finishedAt,
  eventSource: metadata.eventSource,
  prompt: metadata.prompt,
  turns: normalization.turns,
  retries: normalization.retries,
  normalization: normalization.diagnostics,
  metrics: computeSessionMetrics(
    normalization.turns,
    normalization.usage,
    metadata.startedAt,
    metadata.finishedAt,
    normalization.retries,
  ),
})

export const SessionServiceLive = Layer.effect(
  SessionService,
  Effect.gen(function*() {
    const fs = yield* FileSystemService

    const createAndSaveFromFile = Effect.fnUntraced(function*(
      metadata: SessionSourceMetadata,
      rawEventsPath: string,
      sessionDir: string,
    ) {
      if (metadata.adapter !== "pi") {
        return yield* Effect.fail(new SessionCompactionError({
          sourcePath: rawEventsPath,
          sessionPath: sessionDir,
          reason: `Unsupported session adapter: ${metadata.adapter}`,
        }))
      }
      const maxToolResultBytes = configuredPositiveInteger(
        "BENCH_SESSION_TOOL_RESULT_MAX_BYTES",
        DEFAULT_TOOL_RESULT_MAX_BYTES,
      )
      const normalization = yield* Effect.tryPromise({
        try: () => normalizePiSessionFile(rawEventsPath, { maxToolResultBytes }),
        catch: (cause) => new SessionCompactionError({
          sourcePath: rawEventsPath,
          sessionPath: sessionDir,
          reason: cause instanceof Error ? cause.message : String(cause),
          cause,
        }),
      })
      const session = makeCompactSession(metadata, normalization)
      const compactJson = `${JSON.stringify(session, null, 2)}\n`
      const compactBytes = Buffer.byteLength(compactJson, "utf8")
      const maxHtmlBytes = configuredPositiveInteger(
        "BENCH_SESSION_HTML_MAX_BYTES",
        DEFAULT_HTML_MAX_BYTES,
      )
      let html = ""
      let htmlSkippedReason: PublishedSession["htmlSkippedReason"]
      if (compactBytes > maxHtmlBytes) {
        htmlSkippedReason = "compact-json-size-limit"
      } else {
        const rendered = renderSessionHtml(session)
        if (Buffer.byteLength(rendered, "utf8") > maxHtmlBytes) {
          htmlSkippedReason = "html-size-limit"
        } else {
          html = rendered
        }
      }
      const htmlBytes = Buffer.byteLength(html, "utf8")
      const htmlGenerated = htmlBytes > 0

      yield* fs.writeFile(
        path.join(sessionDir, SessionFile.SESSION_COMPACT_JSON),
        compactJson,
      )
      yield* fs.writeJson(path.join(sessionDir, SessionFile.METRICS_JSON), {
        ...session.metrics,
        publication: {
          compactBytes,
          htmlGenerated,
          htmlBytes,
          htmlMaxBytes: maxHtmlBytes,
          ...(htmlSkippedReason === undefined ? {} : { htmlSkippedReason }),
        },
      })

      const htmlPath = path.join(sessionDir, SessionFile.SESSION_HTML)
      if (htmlGenerated) yield* fs.writeFile(htmlPath, html)
      else yield* fs.removePath(htmlPath)
      yield* fs.removePath(path.join(sessionDir, "session.json"))
      yield* fs.removePath(path.join(sessionDir, "session.md"))

      return {
        session,
        htmlGenerated,
        compactBytes,
        htmlBytes,
        ...(htmlSkippedReason === undefined ? {} : { htmlSkippedReason }),
      } satisfies PublishedSession
    })

    const createAndSave = Effect.fnUntraced(function*(
      run: Run,
      evidenceDir: string,
      sessionDir: string,
      prompt: string,
    ) {
      const canonicalEventsPath = path.join(evidenceDir, EvidenceFile.AGENT_EVENTS)
      const legacyStdoutPath = path.join(evidenceDir, EvidenceFile.AGENT_STDOUT)
      const hasCanonicalEvents = yield* fs.exists(canonicalEventsPath)
      const sourcePath = hasCanonicalEvents ? canonicalEventsPath : legacyStdoutPath
      const result = yield* createAndSaveFromFile(
        {
          adapter: run.agent.adapter,
          model: run.agent.model ?? "unknown",
          runId: run.runId,
          taskId: run.taskId,
          agentId: run.agentId,
          startedAt: run.startedAt,
          finishedAt: run.finishedAt,
          prompt,
          eventSource: path.basename(sourcePath),
        },
        sourcePath,
        sessionDir,
      )
      return result.session
    })

    return { createAndSave, createAndSaveFromFile } satisfies SessionService
  }),
)

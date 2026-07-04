/** Compact, provider-neutral representation of an agent session. */

export interface SessionAttachment {
  readonly type: "image" | "file"
  readonly mimeType?: string
  readonly name?: string
  readonly width?: number
  readonly height?: number
}

export interface SessionTruncation {
  readonly truncated: true
  readonly originalBytes: number
  readonly retainedBytes: number
}

export interface SessionToolCall {
  readonly id: string
  readonly name: string
  readonly arguments: Record<string, unknown>
}

export type SessionContentBlock =
  | { readonly type: "thinking"; readonly text: string }
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "toolCall"; readonly toolCall: SessionToolCall }

export interface SessionTurnError {
  readonly message: string
  readonly stopReason?: string
}

export interface SessionTurn {
  readonly index: number
  readonly role: "user" | "assistant" | "toolResult"
  readonly userText?: string
  readonly attachments?: ReadonlyArray<SessionAttachment>
  readonly content?: ReadonlyArray<SessionContentBlock>
  readonly toolCallId?: string
  readonly toolName?: string
  readonly toolResult?: string
  readonly toolError?: boolean
  readonly toolResultTruncation?: SessionTruncation
  readonly usage?: SessionTokenUsage
  readonly error?: SessionTurnError
  readonly timestamp?: number
}

export interface SessionRetry {
  readonly attempt: number
  readonly maxAttempts?: number
  readonly delayMs?: number
  readonly errorMessage?: string
  readonly success?: boolean
  readonly finalError?: string
  readonly timestamp?: number
}

export interface SessionTokenUsage {
  readonly inputTokens: number
  readonly outputTokens: number
  readonly reasoningTokens?: number
  readonly cacheReadTokens?: number
  readonly cacheWriteTokens?: number
  readonly totalTokens: number
  readonly costUsd?: number
}

export interface SessionNormalizationDiagnostics {
  readonly rawBytes: number
  readonly rawEventCount: number
  readonly malformedLineCount: number
  readonly unknownEventTypes: ReadonlyArray<string>
}

export interface AgentEventNormalization {
  readonly turns: ReadonlyArray<SessionTurn>
  readonly retries: ReadonlyArray<SessionRetry>
  readonly usage: SessionTokenUsage
  readonly diagnostics: SessionNormalizationDiagnostics
}

export interface AgentSession {
  readonly schemaVersion: 2
  readonly adapter: string
  readonly model: string
  readonly runId: string
  readonly taskId: string
  readonly agentId: string
  readonly startedAt: string | null
  readonly finishedAt: string | null
  readonly eventSource: string | null
  readonly prompt: string
  readonly turns: ReadonlyArray<SessionTurn>
  readonly retries: ReadonlyArray<SessionRetry>
  readonly normalization: SessionNormalizationDiagnostics
  readonly metrics: SessionMetrics
}

export interface SessionMetrics {
  readonly totalTurns: number
  readonly totalToolCalls: number
  readonly toolCallBreakdown: Readonly<Record<string, number>>
  readonly totalThinkingChars: number
  readonly totalOutputChars: number
  readonly totalErrors: number
  readonly totalRetries: number
  readonly toolOutputOriginalBytes: number
  readonly toolOutputRetainedBytes: number
  readonly usage: SessionTokenUsage
  readonly durationSeconds: number | null
}

export const sessionTerminalError = (session: AgentSession): string | null => {
  for (let index = session.retries.length - 1; index >= 0; index -= 1) {
    const retry = session.retries[index]
    if (retry?.success === false && retry.finalError !== undefined) {
      return retry.finalError
    }
  }

  for (let index = session.turns.length - 1; index >= 0; index -= 1) {
    const turn = session.turns[index]
    if (turn?.role === "assistant") return turn.error?.message ?? null
  }
  return null
}

export const makeEmptySession = (
  adapter: string,
  model: string,
  runId: string,
  taskId: string,
  agentId: string,
  prompt: string,
  startedAt: string | null,
  finishedAt: string | null,
): AgentSession => ({
  schemaVersion: 2,
  adapter,
  model,
  runId,
  taskId,
  agentId,
  startedAt,
  finishedAt,
  eventSource: null,
  prompt,
  turns: [],
  retries: [],
  normalization: {
    rawBytes: 0,
    rawEventCount: 0,
    malformedLineCount: 0,
    unknownEventTypes: [],
  },
  metrics: {
    totalTurns: 0,
    totalToolCalls: 0,
    toolCallBreakdown: {},
    totalThinkingChars: 0,
    totalOutputChars: 0,
    totalErrors: 0,
    totalRetries: 0,
    toolOutputOriginalBytes: 0,
    toolOutputRetainedBytes: 0,
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    },
    durationSeconds: null,
  },
})

import { createReadStream, statSync } from "node:fs"
import { createInterface } from "node:readline"
import { Option, Schema } from "effect"
import type {
  AgentEventNormalization,
  SessionAttachment,
  SessionContentBlock,
  SessionRetry,
  SessionTokenUsage,
  SessionTruncation,
  SessionTurn,
} from "../../domain/Session.js"

const PiEventBaseSchema = Schema.Struct({ type: Schema.String })

export interface PiSessionNormalizationOptions {
  readonly maxToolResultBytes?: number
}

interface MutableToolCall {
  id: string
  name: string
  argumentsText: string
}

const DEFAULT_MAX_TOOL_RESULT_BYTES = 64 * 1024

const asRecord = (value: unknown): Readonly<Record<string, unknown>> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : undefined

const records = (value: unknown): ReadonlyArray<Readonly<Record<string, unknown>>> =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        const record = asRecord(item)
        return record === undefined ? [] : [record]
      })
    : []

const optionalString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined

const nonEmptyString = (value: unknown): string | undefined => {
  const parsed = optionalString(value)
  return parsed === undefined || parsed.length === 0 ? undefined : parsed
}

const optionalNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined

const optionalBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined

const parseAttachment = (
  block: Readonly<Record<string, unknown>>,
): SessionAttachment | null => {
  if (block.type !== "image" && block.type !== "file") return null
  const mimeType = nonEmptyString(block.mimeType) ?? nonEmptyString(block.mediaType)
  const name = nonEmptyString(block.name) ?? nonEmptyString(block.fileName)
  const width = optionalNumber(block.width)
  const height = optionalNumber(block.height)
  return {
    type: block.type,
    ...(mimeType === undefined ? {} : { mimeType }),
    ...(name === undefined ? {} : { name }),
    ...(width === undefined ? {} : { width }),
    ...(height === undefined ? {} : { height }),
  }
}

const parseToolArguments = (value: unknown): Record<string, unknown> => {
  const direct = asRecord(value)
  if (direct !== undefined) return { ...direct }
  if (typeof value !== "string") return {}
  if (value.length === 0) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    const parsedRecord = asRecord(parsed)
    return parsedRecord === undefined ? { raw: value } : { ...parsedRecord }
  } catch {
    return { raw: value }
  }
}

const parseMessageBlocks = (
  message: Readonly<Record<string, unknown>>,
): ReadonlyArray<SessionContentBlock> => {
  const blocks: SessionContentBlock[] = []
  for (const block of records(message.content)) {
    if (block.type === "thinking") {
      const text = optionalString(block.thinking) ?? optionalString(block.text) ?? ""
      if (text.length > 0) blocks.push({ type: "thinking", text })
      continue
    }
    if (block.type === "text") {
      const text = optionalString(block.text) ?? ""
      if (text.length > 0) blocks.push({ type: "text", text })
      continue
    }
    if (block.type === "toolCall") {
      const argumentValue = block.arguments ?? block.args ?? block.partialArgs
      blocks.push({
        type: "toolCall",
        toolCall: {
          id: optionalString(block.id) ?? "",
          name: optionalString(block.name) ?? "",
          arguments: parseToolArguments(argumentValue),
        },
      })
    }
  }
  return blocks
}

const parseMessageText = (message: Readonly<Record<string, unknown>>): string =>
  records(message.content)
    .filter((block) => block.type === "text")
    .map((block) => optionalString(block.text) ?? "")
    .join("\n")

const parseUsage = (message: Readonly<Record<string, unknown>>): SessionTokenUsage | undefined => {
  const usage = asRecord(message.usage)
  if (usage === undefined) return undefined
  const inputTokens = optionalNumber(usage.input) ?? 0
  const outputTokens = optionalNumber(usage.output) ?? 0
  const reasoningTokens = optionalNumber(usage.reasoning)
  const cacheReadTokens = optionalNumber(usage.cacheRead)
  const cacheWriteTokens = optionalNumber(usage.cacheWrite)
  const reportedTotalTokens = optionalNumber(usage.totalTokens)
  const cost = optionalNumber(asRecord(usage.cost)?.total)
  return {
    inputTokens,
    outputTokens,
    totalTokens: reportedTotalTokens ?? inputTokens + outputTokens,
    ...(reasoningTokens === undefined ? {} : { reasoningTokens }),
    ...(cacheReadTokens === undefined ? {} : { cacheReadTokens }),
    ...(cacheWriteTokens === undefined ? {} : { cacheWriteTokens }),
    ...(cost === undefined ? {} : { costUsd: cost }),
  }
}

const truncateToolResult = (
  text: string,
  maxBytes: number,
): { readonly text: string; readonly truncation?: SessionTruncation } => {
  const bytes = Buffer.from(text, "utf8")
  if (bytes.byteLength <= maxBytes) return { text }
  const retained = bytes.subarray(0, maxBytes).toString("utf8")
  return {
    text: retained,
    truncation: {
      truncated: true,
      originalBytes: bytes.byteLength,
      retainedBytes: Buffer.byteLength(retained, "utf8"),
    },
  }
}

const knownTopLevelEvents = new Set([
  "session",
  "agent_start",
  "agent_end",
  "turn_start",
  "turn_end",
  "message_start",
  "message_update",
  "message_end",
  "tool_execution_start",
  "tool_execution_update",
  "tool_execution_end",
  "auto_retry_start",
  "auto_retry_end",
])

class PiSessionAccumulator {
  readonly #maxToolResultBytes: number
  readonly #turns: SessionTurn[] = []
  readonly #retries: SessionRetry[] = []
  readonly #unknownEventTypes = new Set<string>()
  readonly #seenToolResultIds = new Set<string>()
  #malformedLineCount = 0
  #rawEventCount = 0
  #observedBytes = 0
  #nextTurnIndex = 0
  #userMessageOpen = false
  #currentBlocks: SessionContentBlock[] = []
  #currentThinking = ""
  #currentText = ""
  #currentToolCall: MutableToolCall | null = null
  #totalInputTokens = 0
  #totalOutputTokens = 0
  #totalReasoningTokens = 0
  #totalCacheRead = 0
  #totalCacheWrite = 0
  #totalTokens = 0
  #totalCost = 0
  #hasReportedCost = false

  constructor(options: PiSessionNormalizationOptions = {}) {
    this.#maxToolResultBytes = options.maxToolResultBytes ?? DEFAULT_MAX_TOOL_RESULT_BYTES
  }

  pushLine(line: string): void {
    this.#observedBytes += Buffer.byteLength(line, "utf8") + 1
    const trimmed = line.trim()
    if (trimmed.length === 0) return
    let parsed: unknown
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      this.#malformedLineCount += 1
      return
    }
    const decoded = Schema.decodeUnknownOption(PiEventBaseSchema)(parsed)
    const raw = asRecord(parsed)
    if (Option.isNone(decoded) || raw === undefined) {
      this.#malformedLineCount += 1
      return
    }
    this.#rawEventCount += 1
    const eventType = decoded.value.type
    if (!knownTopLevelEvents.has(eventType)) {
      this.#unknownEventTypes.add(eventType)
      return
    }
    this.#consume(eventType, raw)
  }

  finish(rawBytes = this.#observedBytes): AgentEventNormalization {
    this.#flushAssistantWithoutMessage()
    return {
      turns: this.#turns,
      retries: this.#retries,
      usage: {
        inputTokens: this.#totalInputTokens,
        outputTokens: this.#totalOutputTokens,
        totalTokens: this.#totalTokens,
        ...(this.#totalReasoningTokens === 0
          ? {}
          : { reasoningTokens: this.#totalReasoningTokens }),
        ...(this.#totalCacheRead === 0 ? {} : { cacheReadTokens: this.#totalCacheRead }),
        ...(this.#totalCacheWrite === 0 ? {} : { cacheWriteTokens: this.#totalCacheWrite }),
        ...(this.#hasReportedCost ? { costUsd: this.#totalCost } : {}),
      },
      diagnostics: {
        rawBytes,
        rawEventCount: this.#rawEventCount,
        malformedLineCount: this.#malformedLineCount,
        unknownEventTypes: [...this.#unknownEventTypes].sort(),
      },
    }
  }

  #consume(eventType: string, event: Readonly<Record<string, unknown>>): void {
    if (eventType === "message_start") {
      const message = asRecord(event.message)
      if (message === undefined) return
      if (message.role === "user") {
        this.#appendUser(message)
        this.#userMessageOpen = true
      } else if (message.role === "assistant") {
        this.#resetAssistantBuffers()
      } else if (message.role === "toolResult") {
        this.#appendToolResultFromMessage(message)
      }
      return
    }

    if (eventType === "message_update") {
      this.#consumeMessageUpdate(event)
      return
    }

    if (eventType === "message_end") {
      const message = asRecord(event.message)
      if (message === undefined) return
      if (message.role === "user") {
        if (this.#userMessageOpen) this.#userMessageOpen = false
        else this.#appendUser(message)
      } else if (message.role === "assistant") {
        this.#appendAssistant(message)
      } else if (message.role === "toolResult") {
        this.#appendToolResultFromMessage(message)
      }
      return
    }

    if (eventType === "tool_execution_start") {
      const id = optionalString(event.toolCallId) ?? ""
      const name = optionalString(event.toolName) ?? ""
      this.#ensureToolCall(id, name, parseToolArguments(event.args))
      return
    }

    if (eventType === "tool_execution_end") {
      const result = asRecord(event.result)
      const text = result === undefined ? "" : parseMessageText(result)
      this.#appendToolResult(
        optionalString(event.toolCallId) ?? "",
        optionalString(event.toolName) ?? "",
        text,
        optionalBoolean(event.isError) ?? optionalBoolean(result?.isError) ?? false,
        optionalNumber(result?.timestamp) ?? optionalNumber(event.timestamp),
      )
      return
    }

    if (eventType === "auto_retry_start") {
      const attempt = optionalNumber(event.attempt)
      if (attempt === undefined) return
      const maxAttempts = optionalNumber(event.maxAttempts)
      const delayMs = optionalNumber(event.delayMs)
      const errorMessage = nonEmptyString(event.errorMessage)
      const timestamp = optionalNumber(event.timestamp)
      this.#retries.push({
        attempt,
        ...(maxAttempts === undefined ? {} : { maxAttempts }),
        ...(delayMs === undefined ? {} : { delayMs }),
        ...(errorMessage === undefined ? {} : { errorMessage }),
        ...(timestamp === undefined ? {} : { timestamp }),
      })
      return
    }

    if (eventType === "auto_retry_end") {
      const attempt = optionalNumber(event.attempt)
      if (attempt === undefined) return
      const success = optionalBoolean(event.success)
      const finalError = nonEmptyString(event.finalError)
        ?? nonEmptyString(event.errorMessage)
        ?? nonEmptyString(asRecord(event.error)?.message)
      const timestamp = optionalNumber(event.timestamp)
      const retryIndex = this.#retries.findIndex((retry) => retry.attempt === attempt)
      const completion = {
        ...(success === undefined ? {} : { success }),
        ...(finalError === undefined ? {} : { finalError }),
        ...(timestamp === undefined ? {} : { timestamp }),
      }
      if (retryIndex >= 0) {
        const retry = this.#retries[retryIndex]
        if (retry !== undefined) this.#retries[retryIndex] = { ...retry, ...completion }
      } else {
        this.#retries.push({ attempt, ...completion })
      }
    }
  }

  #consumeMessageUpdate(event: Readonly<Record<string, unknown>>): void {
    const subEvent = asRecord(event.assistantMessageEvent)
    const subType = nonEmptyString(subEvent?.type)
    if (subEvent === undefined || subType === undefined) return
    if (subType === "thinking_start") {
      this.#flushText()
      this.#flushToolCall()
      this.#currentThinking = ""
    } else if (subType === "thinking_delta") {
      this.#currentThinking += optionalString(subEvent.delta) ?? ""
    } else if (subType === "thinking_end") {
      this.#flushThinking()
    } else if (subType === "text_start") {
      this.#flushThinking()
      this.#flushToolCall()
      this.#currentText = ""
    } else if (subType === "text_delta") {
      this.#currentText += optionalString(subEvent.delta) ?? ""
    } else if (subType === "text_end") {
      this.#flushText()
    } else if (subType === "toolcall_start") {
      this.#flushThinking()
      this.#flushText()
      this.#flushToolCall()
      const partial = asRecord(subEvent.partial)
      const block = records(partial?.content).find((item) => item.type === "toolCall")
      this.#currentToolCall = {
        id: optionalString(block?.id) ?? "",
        name: optionalString(block?.name) ?? "",
        argumentsText: "",
      }
    } else if (subType === "toolcall_delta" && this.#currentToolCall !== null) {
      this.#currentToolCall.argumentsText += optionalString(subEvent.delta) ?? ""
    } else if (subType === "toolcall_end") {
      this.#flushToolCall()
    }
  }

  #appendUser(message: Readonly<Record<string, unknown>>): void {
    const attachments = records(message.content)
      .map(parseAttachment)
      .filter((attachment): attachment is SessionAttachment => attachment !== null)
    const timestamp = optionalNumber(message.timestamp)
    this.#turns.push({
      index: this.#nextTurnIndex,
      role: "user",
      userText: parseMessageText(message),
      ...(attachments.length === 0 ? {} : { attachments }),
      ...(timestamp === undefined ? {} : { timestamp }),
    })
    this.#nextTurnIndex += 1
  }

  #appendAssistant(message: Readonly<Record<string, unknown>>): void {
    this.#flushAllBuffers()
    const canonicalBlocks = parseMessageBlocks(message)
    const content = canonicalBlocks.length > 0 ? canonicalBlocks : this.#currentBlocks
    const usage = parseUsage(message)
    if (usage !== undefined) this.#accumulateUsage(usage)
    const stopReason = nonEmptyString(message.stopReason)
    const errorMessage = nonEmptyString(message.errorMessage)
    const hasError = errorMessage !== undefined || stopReason === "error" || stopReason === "aborted"
    if (content.length > 0 || usage !== undefined || hasError) {
      const timestamp = optionalNumber(message.timestamp)
      this.#turns.push({
        index: this.#nextTurnIndex,
        role: "assistant",
        content: [...content],
        ...(usage === undefined ? {} : { usage }),
        ...(hasError
          ? {
              error: {
                message: errorMessage ?? stopReason ?? "assistant error",
                ...(stopReason === undefined ? {} : { stopReason }),
              },
            }
          : {}),
        ...(timestamp === undefined ? {} : { timestamp }),
      })
      this.#nextTurnIndex += 1
    }
    this.#resetAssistantBuffers()
  }

  #appendToolResultFromMessage(message: Readonly<Record<string, unknown>>): void {
    this.#appendToolResult(
      optionalString(message.toolCallId) ?? "",
      optionalString(message.toolName) ?? "",
      parseMessageText(message),
      optionalBoolean(message.isError) ?? false,
      optionalNumber(message.timestamp),
    )
  }

  #appendToolResult(
    id: string,
    name: string,
    result: string,
    isError: boolean,
    timestamp: number | undefined,
  ): void {
    const dedupeKey = id.length > 0 ? id : `${name}:${this.#nextTurnIndex}`
    if (this.#seenToolResultIds.has(dedupeKey)) return
    this.#seenToolResultIds.add(dedupeKey)
    const truncated = truncateToolResult(result, this.#maxToolResultBytes)
    this.#turns.push({
      index: this.#nextTurnIndex,
      role: "toolResult",
      toolCallId: id,
      toolName: name,
      toolResult: truncated.text,
      toolError: isError,
      ...(truncated.truncation === undefined
        ? {}
        : { toolResultTruncation: truncated.truncation }),
      ...(timestamp === undefined ? {} : { timestamp }),
    })
    this.#nextTurnIndex += 1
  }

  #ensureToolCall(id: string, name: string, args: Record<string, unknown>): void {
    for (let index = this.#turns.length - 1; index >= 0; index -= 1) {
      const turn = this.#turns[index]
      if (turn?.role !== "assistant" || turn.content === undefined) continue
      const position = turn.content.findIndex(
        (block) => block.type === "toolCall" && block.toolCall.id === id,
      )
      if (position < 0) continue
      const updated = [...turn.content]
      updated[position] = { type: "toolCall", toolCall: { id, name, arguments: args } }
      this.#turns[index] = { ...turn, content: updated }
      return
    }
    const lastTurn = this.#turns.at(-1)
    if (lastTurn?.role === "assistant") {
      this.#turns[this.#turns.length - 1] = {
        ...lastTurn,
        content: [
          ...(lastTurn.content ?? []),
          { type: "toolCall", toolCall: { id, name, arguments: args } },
        ],
      }
      return
    }
    this.#turns.push({
      index: this.#nextTurnIndex,
      role: "assistant",
      content: [{ type: "toolCall", toolCall: { id, name, arguments: args } }],
    })
    this.#nextTurnIndex += 1
  }

  #accumulateUsage(usage: SessionTokenUsage): void {
    this.#totalInputTokens += usage.inputTokens
    this.#totalOutputTokens += usage.outputTokens
    this.#totalReasoningTokens += usage.reasoningTokens ?? 0
    this.#totalCacheRead += usage.cacheReadTokens ?? 0
    this.#totalCacheWrite += usage.cacheWriteTokens ?? 0
    this.#totalTokens += usage.totalTokens
    if (usage.costUsd !== undefined) {
      this.#totalCost += usage.costUsd
      this.#hasReportedCost = true
    }
  }

  #flushThinking(): void {
    if (this.#currentThinking.length === 0) return
    this.#currentBlocks.push({ type: "thinking", text: this.#currentThinking })
    this.#currentThinking = ""
  }

  #flushText(): void {
    if (this.#currentText.length === 0) return
    this.#currentBlocks.push({ type: "text", text: this.#currentText })
    this.#currentText = ""
  }

  #flushToolCall(): void {
    if (this.#currentToolCall === null) return
    this.#currentBlocks.push({
      type: "toolCall",
      toolCall: {
        id: this.#currentToolCall.id,
        name: this.#currentToolCall.name,
        arguments: parseToolArguments(this.#currentToolCall.argumentsText),
      },
    })
    this.#currentToolCall = null
  }

  #flushAllBuffers(): void {
    this.#flushThinking()
    this.#flushText()
    this.#flushToolCall()
  }

  #flushAssistantWithoutMessage(): void {
    this.#flushAllBuffers()
    if (this.#currentBlocks.length === 0) return
    this.#turns.push({
      index: this.#nextTurnIndex,
      role: "assistant",
      content: [...this.#currentBlocks],
    })
    this.#nextTurnIndex += 1
    this.#resetAssistantBuffers()
  }

  #resetAssistantBuffers(): void {
    this.#currentBlocks = []
    this.#currentThinking = ""
    this.#currentText = ""
    this.#currentToolCall = null
  }
}

export const normalizePiSessionEvents = (
  eventsJsonl: string,
  options: PiSessionNormalizationOptions = {},
): AgentEventNormalization => {
  const accumulator = new PiSessionAccumulator(options)
  for (const line of eventsJsonl.split("\n")) accumulator.pushLine(line)
  return accumulator.finish(Buffer.byteLength(eventsJsonl, "utf8"))
}

export const normalizePiSessionFile = (
  path: string,
  options: PiSessionNormalizationOptions = {},
): Promise<AgentEventNormalization> =>
  new Promise((resolve, reject) => {
    const accumulator = new PiSessionAccumulator(options)
    let rawBytes: number
    try {
      rawBytes = statSync(path).size
    } catch (error) {
      reject(error)
      return
    }
    const input = createReadStream(path, { encoding: "utf8" })
    const lines = createInterface({ input, crlfDelay: Infinity })
    let settled = false
    const fail = (error: unknown) => {
      if (settled) return
      settled = true
      reject(error)
    }
    input.on("error", fail)
    lines.on("error", fail)
    lines.on("line", (line) => accumulator.pushLine(line))
    lines.on("close", () => {
      if (settled) return
      settled = true
      resolve(accumulator.finish(rawBytes))
    })
  })

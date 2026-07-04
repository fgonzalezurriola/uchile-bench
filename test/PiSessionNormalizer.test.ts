import { describe, test } from "bun:test"
import assert from "node:assert/strict"
import { normalizePiSessionEvents } from "../src/adapters/pi/PiSessionNormalizer.js"
import {
  computeSessionMetrics,
  makeCompactSession,
  renderSessionHtml,
} from "../src/services/SessionService.js"

const line = (value: unknown): string => JSON.stringify(value)

describe("Pi session normalization", () => {
  test("collapses thinking and text streaming deltas", () => {
    const normalized = normalizePiSessionEvents([
      line({ type: "message_update", assistantMessageEvent: { type: "thinking_start" } }),
      line({ type: "message_update", assistantMessageEvent: { type: "thinking_delta", delta: "plan " } }),
      line({ type: "message_update", assistantMessageEvent: { type: "thinking_delta", delta: "carefully" } }),
      line({ type: "message_update", assistantMessageEvent: { type: "thinking_end" } }),
      line({ type: "message_update", assistantMessageEvent: { type: "text_start" } }),
      line({ type: "message_update", assistantMessageEvent: { type: "text_delta", delta: "final " } }),
      line({ type: "message_update", assistantMessageEvent: { type: "text_delta", delta: "answer" } }),
      line({ type: "message_end", message: { role: "assistant", usage: { input: 2, output: 3 } } }),
    ].join("\n"))

    assert.equal(normalized.turns.length, 1)
    assert.deepEqual(normalized.turns[0]?.content, [
      { type: "thinking", text: "plan carefully" },
      { type: "text", text: "final answer" },
    ])
    assert.equal(normalized.diagnostics.rawEventCount, 8)
  })

  test("preserves tool calls and truncates large tool output with byte metadata", () => {
    const normalized = normalizePiSessionEvents([
      line({
        type: "message_update",
        assistantMessageEvent: {
          type: "toolcall_start",
          partial: { content: [{ type: "toolCall", id: "call-1", name: "bash" }] },
        },
      }),
      line({ type: "message_update", assistantMessageEvent: { type: "toolcall_delta", delta: '{"command":"printf test"}' } }),
      line({ type: "message_update", assistantMessageEvent: { type: "toolcall_end" } }),
      line({ type: "message_end", message: { role: "assistant", usage: { input: 4, output: 2, totalTokens: 6 } } }),
      line({
        type: "tool_execution_end",
        toolCallId: "call-1",
        toolName: "bash",
        result: { content: [{ type: "text", text: "abcdefghij" }] },
        isError: false,
      }),
      line({
        type: "message_start",
        message: {
          role: "toolResult",
          toolCallId: "call-1",
          toolName: "bash",
          content: [{ type: "text", text: "abcdefghij" }],
          isError: false,
        },
      }),
    ].join("\n"), { maxToolResultBytes: 5 })

    const assistant = normalized.turns.find((turn) => turn.role === "assistant")
    const toolCall = assistant?.content?.find((block) => block.type === "toolCall")
    assert.equal(toolCall?.type, "toolCall")
    if (toolCall?.type === "toolCall") {
      assert.equal(toolCall.toolCall.name, "bash")
      assert.deepEqual(toolCall.toolCall.arguments, { command: "printf test" })
    }

    const results = normalized.turns.filter((turn) => turn.role === "toolResult")
    assert.equal(results.length, 1)
    assert.equal(results[0]?.toolResult, "abcde")
    assert.deepEqual(results[0]?.toolResultTruncation, {
      truncated: true,
      originalBytes: 10,
      retainedBytes: 5,
    })
  })

  test("calculates aggregate tokens, costs, errors, retries, and tool metrics", () => {
    const normalized = normalizePiSessionEvents([
      line({ type: "auto_retry_start", attempt: 1, maxAttempts: 3, delayMs: 1000, errorMessage: "rate limited" }),
      line({
        type: "message_end",
        message: {
          role: "assistant",
          content: [{ type: "thinking", thinking: "reason" }, { type: "text", text: "answer" }],
          stopReason: "error",
          errorMessage: "provider failed",
          usage: {
            input: 10,
            output: 4,
            reasoning: 2,
            cacheRead: 3,
            totalTokens: 16,
            cost: { total: 0.03 },
          },
        },
      }),
    ].join("\n"))

    const metrics = computeSessionMetrics(
      normalized.turns,
      normalized.usage,
      "2026-06-27T10:00:00.000Z",
      "2026-06-27T10:00:02.000Z",
      normalized.retries,
    )
    assert.equal(metrics.totalTurns, 1)
    assert.equal(metrics.totalThinkingChars, 6)
    assert.equal(metrics.totalOutputChars, 6)
    assert.equal(metrics.totalErrors, 1)
    assert.equal(metrics.totalRetries, 1)
    assert.equal(metrics.usage.totalTokens, 16)
    assert.equal(metrics.usage.reasoningTokens, 2)
    assert.equal(metrics.usage.costUsd, 0.03)
    assert.equal(metrics.durationSeconds, 2)
  })

  test("merges failed auto_retry_end data into the matching retry", () => {
    const normalized = normalizePiSessionEvents([
      line({
        type: "auto_retry_start",
        attempt: 3,
        maxAttempts: 3,
        delayMs: 2000,
        errorMessage: "Retrying after provider error",
        timestamp: 100,
      }),
      line({
        type: "message_end",
        message: {
          role: "assistant",
          content: [],
          stopReason: "error",
          errorMessage: "Provider request failed",
          usage: { input: 8, output: 0, totalTokens: 8 },
        },
      }),
      line({
        type: "auto_retry_end",
        attempt: 3,
        success: false,
        finalError: "429 Rate limit exceeded after final retry",
        timestamp: 200,
      }),
    ].join("\n"))

    assert.equal(normalized.retries.length, 1)
    assert.deepEqual(normalized.retries[0], {
      attempt: 3,
      maxAttempts: 3,
      delayMs: 2000,
      errorMessage: "Retrying after provider error",
      success: false,
      finalError: "429 Rate limit exceeded after final retry",
      timestamp: 200,
    })

    const session = makeCompactSession({
      adapter: "pi",
      model: "model",
      runId: "run",
      taskId: "task",
      agentId: "agent",
      startedAt: null,
      finishedAt: null,
      prompt: "prompt",
      eventSource: "events.jsonl",
    }, normalized)
    const compact = JSON.parse(JSON.stringify(session)) as typeof session
    assert.equal(session.metrics.totalRetries, 1)
    assert.equal(compact.retries[0]?.success, false)
    assert.equal(
      compact.retries[0]?.finalError,
      "429 Rate limit exceeded after final retry",
    )

    const endOnly = normalizePiSessionEvents(line({
      type: "auto_retry_end",
      attempt: 4,
      success: true,
      timestamp: 300,
    }))
    assert.deepEqual(endOnly.retries, [{ attempt: 4, success: true, timestamp: 300 }])
  })

  test("does not invent thinking when Pi exposes only assistant text", () => {
    const normalized = normalizePiSessionEvents([
      line({
        type: "message_end",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "visible output" }],
          usage: { input: 1, output: 2 },
        },
      }),
    ].join("\n"))

    const blocks = normalized.turns[0]?.content ?? []
    assert.equal(blocks.some((block) => block.type === "thinking"), false)
    assert.deepEqual(blocks, [{ type: "text", text: "visible output" }])
  })

  test("renders a compact standalone HTML timeline", () => {
    const normalized = normalizePiSessionEvents(line({
      type: "message_end",
      message: { role: "assistant", content: [{ type: "text", text: "answer" }], usage: { input: 2, output: 3 } },
    }))
    const session = makeCompactSession({
      adapter: "pi",
      model: "model",
      runId: "run",
      taskId: "task",
      agentId: "agent",
      startedAt: null,
      finishedAt: null,
      prompt: "prompt",
      eventSource: "Pi --mode json (transient)",
    }, normalized)
    const html = renderSessionHtml(session)
    assert.match(html, /thinking-toggle/)
    assert.match(html, /tools-toggle/)
    assert.match(html, /answer/)
    assert.doesNotMatch(html, /thinking_delta/)
  })
})

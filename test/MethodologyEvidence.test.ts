import { afterEach, describe, test } from "bun:test"
import assert from "node:assert/strict"
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { Effect, Layer } from "effect"
import {
  PI_DEFAULT_TOOLS,
  PI_SYSTEM_PROMPT_STRATEGY,
  PI_VERSION,
} from "../src/adapters/pi/PiPromptAddon.js"
import { makeRun, type Run, type RunPaths } from "../src/domain/Run.js"
import {
  EvidenceService,
  EvidenceServiceLive,
} from "../src/services/EvidenceService.js"
import { FileSystemServiceLive } from "../src/services/FileSystemService.js"
import { HashServiceLive } from "../src/services/HashService.js"
import {
  SessionService,
  SessionServiceLive,
} from "../src/services/SessionService.js"

const temporaryDirectories: string[] = []

const makeTemporaryDirectory = (): string => {
  const directory = mkdtempSync(path.join(tmpdir(), "ai-task-bench-methodology-"))
  temporaryDirectories.push(directory)
  return directory
}

const makePaths = (runDirectory: string): RunPaths => ({
  input: path.join(runDirectory, "00-input"),
  workspace: path.join(runDirectory, "01-workspace"),
  agentHome: path.join(runDirectory, "02-agent-home"),
  agentConfig: path.join(runDirectory, "03-agent-config"),
  output: path.join(runDirectory, "04-output"),
  evidence: path.join(runDirectory, "05-evidence"),
  review: path.join(runDirectory, "06-review"),
  session: path.join(runDirectory, "07-session"),
})

const makePiRun = (runDirectory: string): Run => {
  const run = makeRun("fixture-run", "course/task", "fixture-agent", makePaths(runDirectory))
  return {
    ...run,
    agent: {
      adapter: "pi",
      model: "fixture-model",
      command: null,
    },
  }
}

const EvidenceLayer = EvidenceServiceLive.pipe(
  Layer.provide(Layer.merge(FileSystemServiceLive, HashServiceLive)),
)
const SessionLayer = SessionServiceLive.pipe(
  Layer.provide(FileSystemServiceLive),
)

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe("methodology evidence", () => {
  test("copies and hashes the exact Pi system-prompt addon", async () => {
    const root = makeTemporaryDirectory()
    const sourcePath = path.join(root, "source-agent-prompt.md")
    const agentConfigPath = path.join(root, "03-agent-config")
    const evidencePath = path.join(root, "05-evidence")
    const addon = "Neutral benchmark instructions.\n"
    writeFileSync(sourcePath, addon, "utf8")

    const metadata = await Effect.runPromise(
      Effect.gen(function*() {
        const evidence = yield* EvidenceService
        return yield* evidence.preserveAgentPromptAddon(
          sourcePath,
          agentConfigPath,
          evidencePath,
          {
            strategy: PI_SYSTEM_PROMPT_STRATEGY,
            piVersion: PI_VERSION,
            invocationPurpose: "Solver",
            addonFile: "agent-prompt.md",
            tools: PI_DEFAULT_TOOLS,
            offlineStartup: true,
          },
        )
      }).pipe(Effect.provide(EvidenceLayer)),
    )

    assert.equal(
      readFileSync(path.join(agentConfigPath, "agent-prompt.md"), "utf8"),
      addon,
    )
    assert.equal(
      readFileSync(path.join(evidencePath, "agent-prompt.md"), "utf8"),
      addon,
    )
    assert.match(metadata.addonSha256, /^[a-f0-9]{64}$/)

    const persisted = JSON.parse(
      readFileSync(path.join(evidencePath, "prompt-metadata.json"), "utf8"),
    ) as Record<string, unknown>
    assert.equal(persisted.strategy, PI_SYSTEM_PROMPT_STRATEGY)
    assert.equal(persisted.piVersion, PI_VERSION)
    assert.equal(persisted.invocationPurpose, "Solver")
    assert.equal(persisted.addonSha256, metadata.addonSha256)
    assert.deepEqual(persisted.tools, PI_DEFAULT_TOOLS)
  })

  test("prefers canonical JSONL, normalizes rich events, and falls back to legacy stdout", async () => {
    const root = makeTemporaryDirectory()
    const run = makePiRun(root)
    const canonicalEvents = [
      {
        type: "message_start",
        message: {
          role: "user",
          content: [
            { type: "text", text: "canonical request" },
            {
              type: "image",
              mimeType: "image/png",
              width: 640,
              height: 480,
              data: "base64-is-not-copied",
            },
          ],
        },
      },
      { type: "message_start", message: { role: "assistant", content: [] } },
      {
        type: "message_update",
        assistantMessageEvent: { type: "thinking_delta", delta: "provider reasoning" },
      },
      {
        type: "message_update",
        assistantMessageEvent: { type: "text_delta", delta: "I will inspect the file." },
      },
      {
        type: "message_update",
        assistantMessageEvent: {
          type: "toolcall_start",
          partial: {
            content: [{ type: "toolCall", id: "call-1", name: "read" }],
          },
        },
      },
      {
        type: "message_update",
        assistantMessageEvent: {
          type: "toolcall_delta",
          delta: '{"path":"main.ts"}',
        },
      },
      {
        type: "message_update",
        assistantMessageEvent: { type: "toolcall_end" },
      },
      {
        type: "message_end",
        message: {
          role: "assistant",
          stopReason: "toolUse",
          usage: {
            input: 10,
            output: 5,
            reasoning: 3,
            totalTokens: 18,
            cost: { total: 0.01 },
          },
        },
      },
      {
        type: "tool_execution_end",
        toolCallId: "call-1",
        toolName: "read",
        result: { content: [{ type: "text", text: "file contents" }] },
        isError: false,
      },
      { type: "message_end", message: { role: "toolResult" } },
      { type: "future_unknown_event", payload: { retainedOnlyInRawJsonl: true } },
    ]
      .map((event) => JSON.stringify(event))
      .join("\n") + "\n"
    const legacyEvents = `${JSON.stringify({
      type: "message_start",
      message: {
        role: "user",
        content: [{ type: "text", text: "legacy request" }],
      },
    })}\n`

    mkdirSync(run.paths.evidence, { recursive: true })
    writeFileSync(path.join(run.paths.evidence, "agent.events.jsonl"), canonicalEvents, "utf8")
    writeFileSync(path.join(run.paths.evidence, "agent.stdout.log"), legacyEvents, "utf8")

    const canonicalSession = await Effect.runPromise(
      Effect.gen(function*() {
        const sessions = yield* SessionService
        return yield* sessions.createAndSave(
          run,
          run.paths.evidence,
          run.paths.session,
          "fixture prompt",
        )
      }).pipe(Effect.provide(SessionLayer)),
    )

    assert.equal(canonicalSession.schemaVersion, 2)
    assert.equal(canonicalSession.eventSource, "agent.events.jsonl")
    assert.equal(canonicalSession.turns[0]?.userText, "canonical request")
    assert.deepEqual(canonicalSession.turns[0]?.attachments, [
      { type: "image", mimeType: "image/png", width: 640, height: 480 },
    ])
    assert.equal(
      JSON.stringify(canonicalSession).includes("base64-is-not-copied"),
      false,
    )
    const assistantTurn = canonicalSession.turns.find((turn) => turn.role === "assistant")
    assert.ok(assistantTurn?.content)
    assert.equal(assistantTurn.content[0]?.type, "thinking")
    assert.equal(assistantTurn.usage?.reasoningTokens, 3)
    assert.equal(assistantTurn.usage?.totalTokens, 18)
    assert.equal(canonicalSession.metrics.usage.totalTokens, 18)
    assert.equal(canonicalSession.metrics.usage.costUsd, 0.01)
    const toolResult = canonicalSession.turns.find((turn) => turn.role === "toolResult")
    assert.equal(toolResult?.toolResult, "file contents")
    assert.equal(toolResult?.toolError, false)

    rmSync(path.join(run.paths.evidence, "agent.events.jsonl"))
    const legacySessionDir = path.join(root, "legacy-session")
    const legacySession = await Effect.runPromise(
      Effect.gen(function*() {
        const sessions = yield* SessionService
        return yield* sessions.createAndSave(
          run,
          run.paths.evidence,
          legacySessionDir,
          "fixture prompt",
        )
      }).pipe(Effect.provide(SessionLayer)),
    )

    assert.equal(legacySession.schemaVersion, 2)
    assert.equal(legacySession.eventSource, "agent.stdout.log")
    assert.equal(legacySession.turns[0]?.userText, "legacy request")
  })
})

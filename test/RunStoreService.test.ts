import { afterEach, describe, test } from "bun:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { Effect, Layer } from "effect"
import { FileSystemServiceLive } from "../src/services/FileSystemService.js"
import {
  RunStoreService,
  RunStoreServiceLive,
} from "../src/services/RunStoreService.js"

const temporaryDirectories: string[] = []

const makeTemporaryDirectory = (): string => {
  const directory = mkdtempSync(path.join(tmpdir(), "ai-task-bench-store-"))
  temporaryDirectories.push(directory)
  return directory
}

const RunStoreLayer = RunStoreServiceLive.pipe(
  Layer.provide(FileSystemServiceLive),
)

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe("RunStoreService", () => {
  test("normalizes legacy structured errors and stale absolute paths while loading run.json", async () => {
    const runDirectory = makeTemporaryDirectory()
    const staleRoot = path.join(makeTemporaryDirectory(), "old-checkout")
    const paths = {
      input: path.join(staleRoot, "00-input"),
      workspace: path.join(staleRoot, "01-workspace"),
      agentHome: path.join(staleRoot, "02-agent-home"),
      agentConfig: path.join(staleRoot, "03-agent-config"),
      output: path.join(staleRoot, "04-output"),
      evidence: path.join(staleRoot, "05-evidence"),
      review: path.join(staleRoot, "06-review"),
      session: path.join(staleRoot, "07-session"),
    }
    writeFileSync(
      path.join(runDirectory, "run.json"),
      `${JSON.stringify(
        {
          runId: "legacy-run",
          taskId: "legacy/task",
          agentId: "legacy-agent",
          status: "failed",
          startedAt: null,
          finishedAt: null,
          durationSeconds: null,
          paths,
          hashes: { inputHash: null, outputHash: null },
          evidence: {
            treeBefore: null,
            treeAfter: null,
            filesBefore: null,
            filesAfter: null,
            diffPatch: null,
            stdoutLog: null,
            stderrLog: null,
            eventsJsonl: null,
          },
          agent: { adapter: "pi", model: null, command: null },
          error: {
            message: "Interrupted by reviewer",
            code: "RUN_INTERRUPTED",
          },
        },
        null,
        2,
      )}\n`,
      "utf8",
    )

    const run = await Effect.runPromise(
      Effect.gen(function*() {
        const store = yield* RunStoreService
        return yield* store.loadRun(runDirectory)
      }).pipe(Effect.provide(RunStoreLayer)),
    )

    assert.equal(run.error, "Interrupted by reviewer")
    assert.equal(run.paths.input, path.join(runDirectory, "00-input"))
    assert.equal(run.paths.workspace, path.join(runDirectory, "01-workspace"))
    assert.equal(run.paths.agentHome, path.join(runDirectory, "02-agent-home"))
    assert.equal(run.paths.agentConfig, path.join(runDirectory, "03-agent-config"))
    assert.equal(run.paths.output, path.join(runDirectory, "04-output"))
    assert.equal(run.paths.evidence, path.join(runDirectory, "05-evidence"))
    assert.equal(run.paths.review, path.join(runDirectory, "06-review"))
    assert.equal(run.paths.session, path.join(runDirectory, "07-session"))
    assert.equal(run.metrics.totalTokens, null)
  })
})

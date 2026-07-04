import { afterEach, describe, test } from "bun:test"
import assert from "node:assert/strict"
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { Effect } from "effect"
import {
  DockerService,
  DockerServiceLive,
} from "../src/services/DockerService.js"

const temporaryDirectories: string[] = []

const makeTemporaryDirectory = (): string => {
  const directory = mkdtempSync(path.join(tmpdir(), "ai-task-bench-docker-test-"))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe("DockerService", () => {
  test("captures large container output through files instead of Bun streams", async () => {
    const root = makeTemporaryDirectory()
    const bin = path.join(root, "bin")
    mkdirSync(bin)
    const fakeDocker = path.join(bin, "docker")
    writeFileSync(
      fakeDocker,
      [
        "#!/usr/bin/env bash",
        "set -euo pipefail",
        "case \"${1:-}\" in",
        "  info)",
        "    echo fake-docker-info",
        "    ;;",
        "  image)",
        "    exit 0",
        "    ;;",
        "  run)",
        "    python3 - <<'PY'",
        "import sys",
        "sys.stdout.write('event-line\\n' * 20000)",
        "sys.stderr.write('stderr-line\\n' * 1000)",
        "PY",
        "    ;;",
        "  *)",
        "    echo \"unexpected docker args: $*\" >&2",
        "    exit 2",
        "    ;;",
        "esac",
        "",
      ].join("\n"),
      "utf8",
    )
    chmodSync(fakeDocker, 0o755)

    const previousPath = process.env.PATH
    process.env.PATH = `${bin}:${previousPath ?? ""}`
    try {
      const result = await Effect.runPromise(
        Effect.gen(function*() {
          const docker = yield* DockerService
          const captureDir = path.join(root, "capture")
          return yield* docker.runContainer({
            image: "fake-image",
            mounts: [],
            env: [],
            workDir: "/workspace",
            command: ["sh", "-c", "echo unused"],
            timeoutMs: 5_000,
            stdoutPath: path.join(captureDir, "events.jsonl"),
            stderrPath: path.join(captureDir, "stderr.log"),
          })
        }).pipe(Effect.provide(DockerServiceLive)),
      )

      assert.equal(result.exitCode, 0)
      assert.equal(result.timedOut, false)
      assert.match(result.stdout, /^event-line/)
      assert.match(result.stderr, /^stderr-line/)
      assert.ok(result.stdoutPath)
      assert.ok(result.stderrPath)
      assert.equal(readFileSync(result.stdoutPath, "utf8").split("\n").length, 20001)
      assert.equal(readFileSync(result.stderrPath, "utf8").split("\n").length, 1001)
    } finally {
      process.env.PATH = previousPath
    }
  })
})

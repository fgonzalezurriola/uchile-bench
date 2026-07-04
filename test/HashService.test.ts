import { afterEach, describe, test } from "bun:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { Effect } from "effect"
import { HashService, HashServiceLive } from "../src/services/HashService.js"

const temporaryDirectories: string[] = []

const makeTemporaryDirectory = (): string => {
  const directory = mkdtempSync(path.join(tmpdir(), "ai-task-bench-hash-"))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe("HashService", () => {
  test("directory hashes depend on relative paths and content, not root location", async () => {
    const first = makeTemporaryDirectory()
    const second = makeTemporaryDirectory()

    mkdirSync(path.join(first, "nested"))
    mkdirSync(path.join(second, "nested"))
    writeFileSync(path.join(first, "assignment.py"), "print('hello')\n")
    writeFileSync(path.join(first, "nested", "data.txt"), "same bytes\n")
    writeFileSync(path.join(second, "nested", "data.txt"), "same bytes\n")
    writeFileSync(path.join(second, "assignment.py"), "print('hello')\n")

    const [firstHash, secondHash] = await Effect.runPromise(
      Effect.gen(function*() {
        const hash = yield* HashService
        return yield* Effect.all([
          hash.hashDirectory(first),
          hash.hashDirectory(second),
        ])
      }).pipe(Effect.provide(HashServiceLive)),
    )

    assert.equal(firstHash, secondHash)
  })
})

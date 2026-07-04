import { Context, Effect, Layer } from "effect"
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"

export interface HashService {
  readonly hashDirectory: (path: string) => Effect.Effect<string>
  readonly hashString: (content: string) => string
  readonly hashFile: (path: string) => Effect.Effect<string>
}

export const HashService = Context.Service<HashService>("HashService")

const collectFiles = (root: string): ReadonlyArray<string> => {
  const pending = [root]
  const files: string[] = []

  while (pending.length > 0) {
    const current = pending.pop()
    if (current === undefined) continue

    const entries = readdirSync(current, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name))

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) pending.push(fullPath)
      else if (entry.isFile()) files.push(fullPath)
    }
  }

  return files.sort((left, right) =>
    path.relative(root, left).localeCompare(path.relative(root, right)),
  )
}

const normalizedRelativePath = (root: string, filePath: string): string =>
  path.relative(root, filePath).split(path.sep).join("/")

function makeHashService(): HashService {
  return {
    hashString: (content) => {
      const hasher = new Bun.CryptoHasher("sha256")
      hasher.update(content)
      return hasher.digest("hex")
    },
    hashFile: (filePath) =>
      Effect.sync(() => {
        const hasher = new Bun.CryptoHasher("sha256")
        hasher.update(readFileSync(filePath))
        return hasher.digest("hex")
      }),
    hashDirectory: (root) =>
      Effect.sync(() => {
        const hasher = new Bun.CryptoHasher("sha256")
        for (const filePath of collectFiles(root)) {
          hasher.update(normalizedRelativePath(root, filePath))
          hasher.update("\0")
          hasher.update(readFileSync(filePath))
          hasher.update("\0")
        }
        return hasher.digest("hex")
      }),
  }
}

export const HashServiceLive = Layer.effect(
  HashService,
  Effect.sync(makeHashService),
)

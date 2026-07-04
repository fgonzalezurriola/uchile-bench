import { existsSync, mkdirSync, renameSync } from "node:fs"
import path from "node:path"

const root = process.cwd()
const moves: ReadonlyArray<readonly [string, string]> = [
  [
    path.join(root, "tasks", "standalone", "001-sample-task"),
    path.join(root, "tasks", "archive", "standalone", "001-sample-task"),
  ],
  [
    path.join(root, "tasks", "cumulative", "CC3501", "t03"),
    path.join(root, "tasks", "archive", "cumulative", "CC3501", "t03"),
  ],
]

for (const [source, destination] of moves) {
  if (!existsSync(source)) continue
  if (existsSync(destination)) {
    throw new Error(`Archive destination already exists: ${destination}`)
  }
  mkdirSync(path.dirname(destination), { recursive: true })
  renameSync(source, destination)
  console.log(`Archived ${path.relative(root, source)}`)
}

import { existsSync, mkdirSync, renameSync } from "node:fs"
import path from "node:path"

const root = process.cwd()
const archiveRoot = path.join(root, "tasks", "archive", "legacy-layout")

const move = (source: string, destination: string): void => {
  if (!existsSync(source)) return
  if (existsSync(destination)) throw new Error(`Destination exists: ${destination}`)
  mkdirSync(path.dirname(destination), { recursive: true })
  renameSync(source, destination)
  console.log(`Archived ${path.relative(root, source)}`)
}

move(path.join(root, "tasks", "CC3001"), path.join(archiveRoot, "CC3001"))
move(path.join(root, "tasks", "CC3501"), path.join(archiveRoot, "CC3501"))

for (const number of [1, 2, 3, 4, 5, 6]) {
  move(
    path.join(root, "tasks", "standalone", "CC3001", `t${number}`),
    path.join(archiveRoot, "standalone", "CC3001", `t${number}`),
  )
}

move(
  path.join(root, "tasks", "cumulative", "CC3501", "stages"),
  path.join(archiveRoot, "cumulative", "CC3501", "stages"),
)
move(
  path.join(root, "tasks", "cumulative", "CC3501", "sequence.json"),
  path.join(archiveRoot, "cumulative", "CC3501", "sequence.json"),
)

import { existsSync, mkdirSync, renameSync } from "node:fs"
import path from "node:path"

const benchRoot = process.cwd()
const repoRoot = path.resolve(benchRoot, "..")

const move = (source: string, destination: string): void => {
  if (!existsSync(source)) return
  if (existsSync(destination)) {
    throw new Error(`Archive destination already exists: ${destination}`)
  }
  mkdirSync(path.dirname(destination), { recursive: true })
  renameSync(source, destination)
  console.log(`Archived ${path.relative(repoRoot, source)}`)
}

for (const course of ["CC3001", "CC3301", "CC3501", "CC4101", "CC4102", "CC4302"]) {
  move(
    path.join(repoRoot, course),
    path.join(repoRoot, "archive", "imported-sources", course),
  )
}

move(
  path.join(benchRoot, "tasks", "CC3001"),
  path.join(benchRoot, "tasks", "archive", "legacy-layout", "CC3001"),
)
move(
  path.join(benchRoot, "tasks", "CC3501"),
  path.join(benchRoot, "tasks", "archive", "legacy-layout", "CC3501"),
)

for (const number of [1, 2, 3, 4, 5, 6]) {
  move(
    path.join(benchRoot, "tasks", "standalone", "CC3001", `t${number}`),
    path.join(
      benchRoot,
      "tasks",
      "archive",
      "legacy-layout",
      "standalone",
      "CC3001",
      `t${number}`,
    ),
  )
}

move(
  path.join(benchRoot, "tasks", "cumulative", "CC3501", "stages"),
  path.join(
    benchRoot,
    "tasks",
    "archive",
    "legacy-layout",
    "cumulative",
    "CC3501",
    "stages",
  ),
)
move(
  path.join(benchRoot, "tasks", "cumulative", "CC3501", "sequence.json"),
  path.join(
    benchRoot,
    "tasks",
    "archive",
    "legacy-layout",
    "cumulative",
    "CC3501",
    "sequence.json",
  ),
)

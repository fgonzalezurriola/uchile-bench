import { existsSync, mkdirSync, renameSync } from "node:fs"
import path from "node:path"

const allowed = new Set(["CC3001", "CC3301", "CC3501", "CC4101", "CC4102", "CC4302"])
const course = process.argv[2]
if (course === undefined || !allowed.has(course)) {
  throw new Error("Expected one imported course identifier")
}

const repoRoot = path.resolve(process.cwd(), "..")
const source = path.join(repoRoot, course)
const destination = path.join(repoRoot, "archive", "imported-sources", course)

if (!existsSync(source)) {
  console.log(`${course} is already archived.`)
} else {
  if (existsSync(destination)) throw new Error(`Destination already exists: ${destination}`)
  mkdirSync(path.dirname(destination), { recursive: true })
  renameSync(source, destination)
  console.log(`Archived ${course}.`)
}

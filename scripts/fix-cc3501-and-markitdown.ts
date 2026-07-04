import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmdirSync,
  writeFileSync,
} from "node:fs"
import { execFileSync } from "node:child_process"
import path from "node:path"

const root = process.cwd()
const tasksRoot = path.join(root, "tasks")
const standaloneT03 = path.join(tasksRoot, "standalone", "CC3501", "t03")
const cumulativeT03 = path.join(tasksRoot, "cumulative", "CC3501", "t03")

if (existsSync(standaloneT03)) {
  if (existsSync(cumulativeT03)) {
    throw new Error(`Destination already exists: ${cumulativeT03}`)
  }
  mkdirSync(path.dirname(cumulativeT03), { recursive: true })
  renameSync(standaloneT03, cumulativeT03)
  const standaloneCourse = path.dirname(standaloneT03)
  if (readdirSync(standaloneCourse).length === 0) rmdirSync(standaloneCourse)
}

const roots = [path.join(tasksRoot, "standalone"), path.join(tasksRoot, "cumulative")]
let converted = 0
let provenanceUpdated = 0

const visit = (directory: string): void => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      visit(entryPath)
      continue
    }

    if (entry.name === "PROVENANCE.md" && path.basename(directory) === "original") {
      const current = readFileSync(entryPath, "utf8")
      const updated = current.replaceAll("`pdftotext -layout`", "`markitdown`")
      if (updated !== current) {
        writeFileSync(entryPath, updated, "utf8")
        provenanceUpdated += 1
      }
      continue
    }

    if (path.extname(entry.name).toLowerCase() !== ".pdf") continue
    if (path.basename(directory) !== "original") continue

    const taskRoot = path.dirname(directory)
    const relativePdf = path.relative(directory, entryPath)
    const publicRelative = `${relativePdf.slice(0, -4)}.md`
    const destination = path.join(taskRoot, "public", publicRelative)
    const markdown = execFileSync("markitdown", [entryPath], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    })
    mkdirSync(path.dirname(destination), { recursive: true })
    writeFileSync(destination, markdown, "utf8")
    converted += 1
  }
}

for (const catalogRoot of roots) {
  if (existsSync(catalogRoot)) visit(catalogRoot)
}

const decisionsPath = path.join(root, "..", "decisiones.md")
if (existsSync(decisionsPath)) {
  const current = readFileSync(decisionsPath, "utf8")
  const updated = current
    .replace(
      "- CC3501 t01-t02: cumulative; t03 standalone.",
      "- CC3501 t01-t03: cumulative.",
    )
    .replace(
      "- `original/` conserva todos los archivos originales; `public/` copia todo salvo PDF y TXT, que se convierten a Markdown para revisión manual previa a los runs.",
      "- `original/` conserva todos los archivos originales; `public/` copia todo salvo PDF y TXT. Los PDF se convierten a Markdown con MarkItDown y los TXT se copian con extensión `.md`, para revisión manual previa a los runs.",
    )
  if (updated !== current) writeFileSync(decisionsPath, updated, "utf8")
}

console.log(
  `CC3501 t03 is cumulative. Regenerated ${converted} PDF Markdown files with MarkItDown and updated ${provenanceUpdated} provenance records.`,
)

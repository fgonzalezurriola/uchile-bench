import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

const filePath = path.join(process.cwd(), "scripts", "import-course-tasks.ts")
const current = readFileSync(filePath, "utf8")
const updated = current.replace(
  "Los PDF se extrajeron a Markdown con `pdftotext -layout`.",
  "Los PDF se convirtieron a Markdown con `markitdown`.",
)
if (updated === current) throw new Error("Expected provenance note was not found")
writeFileSync(filePath, updated, "utf8")

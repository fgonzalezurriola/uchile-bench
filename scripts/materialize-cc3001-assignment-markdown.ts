import { Buffer } from "node:buffer"
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"

const root = "tasks/standalone/CC3001"

const taskDirectories = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^t0\d$/.test(entry.name))
  .map((entry) => path.join(root, entry.name))
  .sort()

const extensionFromMime = (mime: string): string => {
  if (mime === "image/jpeg") return ".jpg"
  if (mime === "image/svg+xml") return ".svg"
  const suffix = mime.split("/")[1]
  return suffix === undefined ? ".bin" : `.${suffix.replace(/[^a-zA-Z0-9]+/g, "")}`
}

const extensionFromUrl = (url: string): string => {
  const parsed = new URL(url)
  const extension = path.extname(parsed.pathname)
  return extension === "" ? ".bin" : extension
}

const safeBaseName = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()

const extractColabMarkdown = (source: string): string => {
  const chunks: Array<string> = []
  let index = 0
  const tripleQuote = '"""'

  while (index < source.length) {
    const start = source.indexOf(tripleQuote, index)
    const code = source.slice(index, start === -1 ? source.length : start).trim()
    if (code !== "" && !/^# -\*- coding: utf-8 -\*-\s*$/.test(code)) {
      chunks.push(["```python", code, "```"].join("\n"))
    }
    if (start === -1) break

    const end = source.indexOf(tripleQuote, start + tripleQuote.length)
    if (end === -1) throw new Error("Unclosed triple-quoted Markdown cell")

    const markdown = source.slice(start + tripleQuote.length, end).trim()
    if (markdown !== "") chunks.push(markdown)
    index = end + tripleQuote.length
  }

  return `${chunks.join("\n\n").trim()}\n`
}

const materializeImages = async (markdown: string, publicDirectory: string): Promise<string> => {
  const assetsDirectory = path.join(publicDirectory, "assets")
  mkdirSync(assetsDirectory, { recursive: true })
  let nextImage = 1
  const replacements = new Map<string, string>()

  const registerDataImage = (mime: string, data: string): string => {
    const key = `data:${mime};base64,${data}`
    const existing = replacements.get(key)
    if (existing !== undefined) return existing

    const filename = `embedded-${String(nextImage).padStart(2, "0")}${extensionFromMime(mime)}`
    nextImage += 1
    writeFileSync(path.join(assetsDirectory, filename), Buffer.from(data, "base64"))
    const relativePath = `assets/${filename}`
    replacements.set(key, relativePath)
    return relativePath
  }

  let localizedMarkdown = markdown.replace(
    /data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)/g,
    (_match, mime: string, data: string) => registerDataImage(mime, data),
  )

  const imageUrls = Array.from(
    new Set(
      [...localizedMarkdown.matchAll(/https?:\/\/[^\s)\]"<>]+/g)]
        .map((match) => match[0])
        .filter((url) => /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url)),
    ),
  )

  for (const url of imageUrls) {
    const existing = replacements.get(url)
    if (existing !== undefined) {
      localizedMarkdown = localizedMarkdown.split(url).join(existing)
      continue
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Could not download ${url}: ${response.status}`)
    }

    const parsed = new URL(url)
    const basename = safeBaseName(path.basename(parsed.pathname, path.extname(parsed.pathname)))
    const filename = `${String(nextImage).padStart(2, "0")}-${basename}${extensionFromUrl(url)}`
    nextImage += 1
    writeFileSync(path.join(assetsDirectory, filename), Buffer.from(await response.arrayBuffer()))

    const relativePath = `assets/${filename}`
    replacements.set(url, relativePath)
    localizedMarkdown = localizedMarkdown.split(url).join(relativePath)
  }

  return localizedMarkdown
}

for (const taskDirectory of taskDirectories) {
  const publicDirectory = path.join(taskDirectory, "public")
  const pythonFile = readdirSync(publicDirectory).find((entry) => entry.endsWith(".py"))
  if (pythonFile === undefined) throw new Error(`No public Python file in ${publicDirectory}`)

  const source = readFileSync(path.join(publicDirectory, pythonFile), "utf8")
  const markdown = await materializeImages(extractColabMarkdown(source), publicDirectory)
  writeFileSync(path.join(publicDirectory, "assignment.md"), markdown, "utf8")

  const taskNumber = taskDirectory.match(/t0(\d)$/)?.[1]
  if (taskNumber === undefined) throw new Error(`Unexpected CC3001 task directory: ${taskDirectory}`)

  writeFileSync(
    path.join(publicDirectory, "INSTRUCTIONS.md"),
    [
      `# CC3001 Tarea ${taskNumber}`,
      "",
      "Lee `assignment.md` para ver el enunciado convertido desde el Colab original, con las imagenes preservadas localmente en `assets/`.",
      "",
      `Completa la tarea editando \`${pythonFile}\` para que contenga una solucion Python funcional.`,
      "",
    ].join("\n"),
    "utf8",
  )
}

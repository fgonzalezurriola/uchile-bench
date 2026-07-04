import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { normalizePiSessionFile } from "../src/adapters/pi/PiSessionNormalizer.js"
import { SessionFile } from "../src/domain/Evidence.js"
import {
  makeCompactSession,
  renderSessionHtml,
  type SessionSourceMetadata,
} from "../src/services/SessionService.js"

interface CliOptions {
  readonly runsRoot: string
  readonly runPath?: string
  readonly dryRun: boolean
  readonly deleteRaw: boolean
  readonly htmlMaxBytes: number
  readonly toolOutputMaxBytes: number
}

interface RawGroup {
  readonly root: string
  readonly sessionDir: string
  readonly sourcePath: string
  readonly rawPaths: ReadonlyArray<string>
}

interface Summary {
  groups: number
  succeeded: number
  failed: number
  rawBytes: number
  retainedBytes: number
  recoverableBytes: number
}

const RAW_NAMES = new Set(["agent.events.jsonl", "agent.stdout.log", "stdout.jsonl"])
const SKIPPED_DIRECTORIES = new Set([
  ".bun",
  ".git",
  ".pi",
  "02-agent-home",
  "07-session",
  "agent-home",
  "node_modules",
])
const SOURCE_PRIORITY: Readonly<Record<string, number>> = {
  "agent.events.jsonl": 0,
  "stdout.jsonl": 1,
  "agent.stdout.log": 2,
}

const parsePositiveInteger = (value: string, flag: string): number => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} requires a positive integer`)
  }
  return parsed
}

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  let runsRoot = "runs"
  let runPath: string | undefined
  let dryRun = false
  let deleteRaw = false
  let htmlMaxBytes = 5 * 1024 * 1024
  let toolOutputMaxBytes = 64 * 1024

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === "--dry-run") dryRun = true
    else if (arg === "--delete-raw") deleteRaw = true
    else if (arg === "--runs-root") {
      const value = args[index + 1]
      if (value === undefined) throw new Error("--runs-root requires a path")
      runsRoot = value
      index += 1
    } else if (arg === "--run") {
      const value = args[index + 1]
      if (value === undefined) throw new Error("--run requires a run directory or raw JSONL path")
      runPath = value
      index += 1
    } else if (arg === "--html-max-bytes") {
      const value = args[index + 1]
      if (value === undefined) throw new Error("--html-max-bytes requires a value")
      htmlMaxBytes = parsePositiveInteger(value, arg)
      index += 1
    } else if (arg === "--tool-output-max-bytes") {
      const value = args[index + 1]
      if (value === undefined) throw new Error("--tool-output-max-bytes requires a value")
      toolOutputMaxBytes = parsePositiveInteger(value, arg)
      index += 1
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: bun run scripts/compact-run-sessions.ts [options]

Options:
  --run <path>                   Process one run directory or raw JSONL file
  --runs-root <path>             Runs root (default: runs)
  --dry-run                      Parse and report without writing files
  --delete-raw                   Delete raw logs and agent-home only after success
  --html-max-bytes <bytes>       Skip HTML above this retained-size limit
  --tool-output-max-bytes <n>    Retain at most n bytes per tool result
`)
      process.exit(0)
    } else {
      throw new Error(`Unknown argument: ${arg}`)
    }
  }

  return {
    runsRoot: path.resolve(runsRoot),
    ...(runPath === undefined ? {} : { runPath: path.resolve(runPath) }),
    dryRun,
    deleteRaw,
    htmlMaxBytes,
    toolOutputMaxBytes,
  }
}

const walkRawFiles = (inputPath: string): ReadonlyArray<string> => {
  if (!existsSync(inputPath)) throw new Error(`Path does not exist: ${inputPath}`)
  if (statSync(inputPath).isFile()) {
    if (!RAW_NAMES.has(path.basename(inputPath))) return []
    return readdirSync(path.dirname(inputPath), { withFileTypes: true })
      .filter((entry) => entry.isFile() && RAW_NAMES.has(entry.name))
      .map((entry) => path.join(path.dirname(inputPath), entry.name))
      .sort()
  }

  const pending = [inputPath]
  const files: string[] = []
  while (pending.length > 0) {
    const current = pending.pop()
    if (current === undefined) continue
    let entries
    try {
      entries = readdirSync(current, { withFileTypes: true })
    } catch (error) {
      console.warn(`skip unreadable directory ${current}: ${error instanceof Error ? error.message : String(error)}`)
      continue
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) pending.push(fullPath)
      } else if (entry.isFile() && RAW_NAMES.has(entry.name)) {
        files.push(fullPath)
      }
    }
  }
  return files.sort()
}

const sessionLocation = (rawPath: string): { readonly root: string; readonly sessionDir: string } => {
  const parent = path.dirname(rawPath)
  if (path.basename(parent) === "05-evidence") {
    const root = path.dirname(parent)
    return { root, sessionDir: path.join(root, "07-session") }
  }
  return { root: parent, sessionDir: path.join(parent, "07-session") }
}

const groupRawFiles = (rawFiles: ReadonlyArray<string>): ReadonlyArray<RawGroup> => {
  const grouped = new Map<string, { root: string; files: string[] }>()
  for (const rawPath of rawFiles) {
    const location = sessionLocation(rawPath)
    const existing = grouped.get(location.sessionDir)
    if (existing === undefined) grouped.set(location.sessionDir, { root: location.root, files: [rawPath] })
    else existing.files.push(rawPath)
  }

  return [...grouped.entries()].map(([sessionDir, value]) => {
    const sorted = [...value.files].sort((left, right) =>
      (SOURCE_PRIORITY[path.basename(left)] ?? 99) - (SOURCE_PRIORITY[path.basename(right)] ?? 99),
    )
    const sourcePath = sorted[0]
    if (sourcePath === undefined) throw new Error(`No raw source for ${sessionDir}`)
    return { root: value.root, sessionDir, sourcePath, rawPaths: sorted }
  }).sort((left, right) => left.sourcePath.localeCompare(right.sourcePath))
}

const readJsonRecord = (filePath: string): Readonly<Record<string, unknown>> | undefined => {
  if (!existsSync(filePath)) return undefined
  try {
    const parsed: unknown = JSON.parse(readFileSync(filePath, "utf8"))
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed as Readonly<Record<string, unknown>>
      : undefined
  } catch {
    return undefined
  }
}

const record = (value: unknown): Readonly<Record<string, unknown>> | undefined =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : undefined

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined

const nullableString = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null

const readText = (filePath: string): string => {
  try {
    return readFileSync(filePath, "utf8")
  } catch {
    return ""
  }
}

const inferTaskId = (root: string, runsRoot: string): string => {
  const parts = path.relative(runsRoot, root).split(path.sep)
  if (parts[0] === "rubrics" && parts.length >= 3) return parts.slice(1, -1).join("/")
  return parts.length >= 2 ? parts.slice(0, -1).join("/") : "unknown"
}

const loadMetadata = (
  group: RawGroup,
  runsRoot: string,
): SessionSourceMetadata => {
  const run = readJsonRecord(path.join(group.root, "run.json"))
  const judge = readJsonRecord(path.join(group.root, "judge-run.json"))
  const adapterConfig = readJsonRecord(path.join(group.root, "agent-config", "adapter-config.json"))
  const agent = record(run?.agent)

  const runId = stringValue(run?.runId) ?? stringValue(judge?.judgeId) ?? path.basename(group.root)
  const taskId = stringValue(run?.taskId) ?? stringValue(judge?.taskId) ?? inferTaskId(group.root, runsRoot)
  const agentId = stringValue(run?.agentId) ?? stringValue(judge?.agentId) ?? stringValue(adapterConfig?.id) ?? "unknown"
  const model = stringValue(agent?.model) ?? stringValue(judge?.model) ?? stringValue(adapterConfig?.model) ?? "unknown"
  const prompt = readText(
    existsSync(path.join(group.root, "05-evidence", "prompt.txt"))
      ? path.join(group.root, "05-evidence", "prompt.txt")
      : path.join(group.root, "prompt.txt"),
  )

  return {
    adapter: "pi",
    model,
    runId,
    taskId,
    agentId,
    startedAt: nullableString(run?.startedAt ?? judge?.startedAt),
    finishedAt: nullableString(run?.finishedAt ?? judge?.finishedAt),
    prompt,
    eventSource: `${path.basename(group.sourcePath)} (historical raw, transient after migration)`,
  }
}

const formatBytes = (bytes: number): string => {
  const units = ["B", "KiB", "MiB", "GiB", "TiB"]
  let value = bytes
  let unit = units[0] ?? "B"
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024
    unit = units[index] ?? unit
  }
  return `${value.toFixed(value >= 10 || unit === "B" ? 0 : 1)} ${unit}`
}

const sizeIfExists = (filePath: string): number => {
  try {
    return statSync(filePath).size
  } catch {
    return 0
  }
}

const removeObsoleteSessionFiles = (group: RawGroup): void => {
  for (const obsolete of ["session.json", "session.md"]) {
    rmSync(path.join(group.sessionDir, obsolete), { force: true })
  }
}

const cleanupAfterSuccess = (group: RawGroup): void => {
  for (const rawPath of group.rawPaths) rmSync(rawPath, { force: true })
  for (const directory of [path.join(group.root, "agent-home"), path.join(group.root, "02-agent-home")]) {
    rmSync(directory, { recursive: true, force: true })
  }
}

const processGroup = async (
  group: RawGroup,
  options: CliOptions,
): Promise<{
  readonly rawBytes: number
  readonly retainedBytes: number
  readonly recoverableBytes: number
  readonly htmlGenerated: boolean
  readonly htmlSkippedReason?: string
}> => {
  const normalization = await normalizePiSessionFile(group.sourcePath, {
    maxToolResultBytes: options.toolOutputMaxBytes,
  })
  const session = makeCompactSession(loadMetadata(group, options.runsRoot), normalization)
  const compactJson = `${JSON.stringify(session, null, 2)}\n`
  let html = ""
  if (Buffer.byteLength(compactJson, "utf8") <= options.htmlMaxBytes) {
    const candidate = renderSessionHtml(session)
    if (Buffer.byteLength(candidate, "utf8") <= options.htmlMaxBytes) html = candidate
  }

  const compactBytes = Buffer.byteLength(compactJson, "utf8")
  const htmlBytes = Buffer.byteLength(html, "utf8")
  const htmlGenerated = htmlBytes > 0
  const htmlSkippedReason = htmlGenerated
    ? undefined
    : compactBytes > options.htmlMaxBytes
      ? "compact-json-size-limit"
      : "html-size-limit"
  const publishedMetricsJson = `${JSON.stringify({
    ...session.metrics,
    publication: {
      compactBytes,
      htmlGenerated,
      htmlBytes,
      htmlMaxBytes: options.htmlMaxBytes,
      ...(htmlSkippedReason === undefined ? {} : { htmlSkippedReason }),
    },
  }, null, 2)}\n`
  const metricsBytes = Buffer.byteLength(publishedMetricsJson, "utf8")
  const retainedBytes = compactBytes + metricsBytes + htmlBytes
  const rawBytes = group.rawPaths.reduce((sum, rawPath) => sum + sizeIfExists(rawPath), 0)
  const recoverableBytes = Math.max(0, rawBytes - retainedBytes)

  if (!options.dryRun) {
    mkdirSync(group.sessionDir, { recursive: true })
    writeFileSync(path.join(group.sessionDir, SessionFile.SESSION_COMPACT_JSON), compactJson)
    writeFileSync(path.join(group.sessionDir, SessionFile.METRICS_JSON), publishedMetricsJson)
    const htmlPath = path.join(group.sessionDir, SessionFile.SESSION_HTML)
    if (html.length > 0) writeFileSync(htmlPath, html)
    else rmSync(htmlPath, { force: true })
    removeObsoleteSessionFiles(group)
    if (options.deleteRaw) cleanupAfterSuccess(group)
  }

  return {
    rawBytes,
    retainedBytes,
    recoverableBytes,
    htmlGenerated,
    ...(htmlSkippedReason === undefined ? {} : { htmlSkippedReason }),
  }
}

const main = async (): Promise<void> => {
  const options = parseArgs(Bun.argv.slice(2))
  const searchRoot = options.runPath ?? options.runsRoot
  const groups = groupRawFiles(walkRawFiles(searchRoot))
  const summary: Summary = {
    groups: groups.length,
    succeeded: 0,
    failed: 0,
    rawBytes: 0,
    retainedBytes: 0,
    recoverableBytes: 0,
  }

  for (const group of groups) {
    try {
      const result = await processGroup(group, options)
      summary.succeeded += 1
      summary.rawBytes += result.rawBytes
      summary.retainedBytes += result.retainedBytes
      summary.recoverableBytes += result.recoverableBytes
      const action = options.dryRun ? "dry-run" : options.deleteRaw ? "compacted+deleted" : "compacted"
      console.log(`[${action}] ${group.sourcePath}`)
      console.log(`  raw ${formatBytes(result.rawBytes)} -> retained ${formatBytes(result.retainedBytes)}; recoverable ${formatBytes(result.recoverableBytes)}`)
      console.log(`  html ${result.htmlGenerated ? "generated" : `skipped (${result.htmlSkippedReason ?? "size limit"})`}`)
    } catch (error) {
      summary.failed += 1
      console.error(`[failed] ${group.sourcePath}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  console.log(`\nGroups: ${summary.groups}; succeeded: ${summary.succeeded}; failed: ${summary.failed}`)
  console.log(`Raw: ${formatBytes(summary.rawBytes)}; retained: ${formatBytes(summary.retainedBytes)}; recoverable: ${formatBytes(summary.recoverableBytes)}`)
  if (summary.failed > 0) process.exitCode = 1
}

await main()

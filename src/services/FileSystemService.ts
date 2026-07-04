import { Context, Effect, Layer } from "effect"
import path from "node:path"
import { FileSystemError } from "../domain/Errors.js"
import {
  appendFileSync,
  chownSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  type Dirent,
} from "node:fs"

/** Directory entry returned by the filesystem boundary. */
export interface DirectoryEntry {
  readonly name: string
  readonly kind: "file" | "directory" | "other"
}

export interface FileSystemService {
  readonly mkdir: (path: string) => Effect.Effect<void, FileSystemError>
  readonly mkdirRecursive: (path: string) => Effect.Effect<void, FileSystemError>
  readonly readFile: (path: string) => Effect.Effect<string, FileSystemError>
  readonly readJson: <A>(path: string) => Effect.Effect<A, FileSystemError>
  readonly writeFile: (path: string, content: string) => Effect.Effect<void, FileSystemError>
  readonly writeJson: (path: string, data: unknown) => Effect.Effect<void, FileSystemError>
  readonly copyDir: (src: string, dest: string) => Effect.Effect<void, FileSystemError>
  readonly exists: (path: string) => Effect.Effect<boolean>
  readonly listDir: (path: string) => Effect.Effect<ReadonlyArray<string>>
  readonly listDirEntries: (
    path: string,
  ) => Effect.Effect<ReadonlyArray<DirectoryEntry>, FileSystemError>
  readonly walkDir: (path: string) => Effect.Effect<ReadonlyArray<string>>
  readonly removeDir: (path: string) => Effect.Effect<void, FileSystemError>
  readonly removePath: (path: string) => Effect.Effect<void, FileSystemError>
  readonly appendFile: (path: string, content: string) => Effect.Effect<void, FileSystemError>
}

export const FileSystemService = Context.Service<FileSystemService>("FileSystemService")

const wrapError = (path: string, reason: string, cause?: unknown) =>
  new FileSystemError({ path, reason, cause })

interface HostOwner {
  readonly uid: number
  readonly gid: number
}

const parsePositiveInteger = (value: string | undefined): number | null => {
  if (value === undefined || value.trim() === "") return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

const getSudoHostOwner = (): HostOwner | null => {
  if (typeof process.getuid === "function" && process.getuid() !== 0) return null
  const uid = parsePositiveInteger(process.env.SUDO_UID)
  const gid = parsePositiveInteger(process.env.SUDO_GID)
  if (uid === null || gid === null || uid === 0) return null
  return { uid, gid }
}

const chownRecursiveSync = (p: string, owner: HostOwner): void => {
  if (!existsSync(p)) return
  chownSync(p, owner.uid, owner.gid)
  let entries: ReadonlyArray<Dirent<string>>
  try {
    entries = readdirSync(p, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const child = path.join(p, entry.name)
    if (entry.isDirectory()) chownRecursiveSync(child, owner)
    else chownSync(child, owner.uid, owner.gid)
  }
}

function makeFileSystemService(): FileSystemService {
  const sudoOwner = getSudoHostOwner()
  const normalizeOwner = (p: string) =>
    Effect.try({
      try: () => {
        if (sudoOwner !== null) chownRecursiveSync(p, sudoOwner)
      },
      catch: (e) => wrapError(p, "ownership normalization failed", e),
    })

  const mkdir = (p: string) =>
    Effect.gen(function*() {
      yield* Effect.try({
        try: () => mkdirSync(p, { recursive: false }),
        catch: (e) => wrapError(p, "mkdir failed", e),
      })
      yield* normalizeOwner(p)
    })

  const mkdirRecursive = (p: string) =>
    Effect.gen(function*() {
      yield* Effect.try({
        try: () => mkdirSync(p, { recursive: true }),
        catch: (e) => wrapError(p, "mkdirRecursive failed", e),
      })
      yield* normalizeOwner(p)
    })

  const readFile = (p: string) =>
    Effect.try({
      try: () => readFileSync(p, "utf-8"),
      catch: (e) => wrapError(p, "readFile failed", e),
    })

  const readJson = <A>(p: string) =>
    readFile(p).pipe(
      Effect.map((text) => JSON.parse(text) as A),
      Effect.mapError((e) =>
        e instanceof FileSystemError ? e : wrapError(p, `JSON parse failed: ${e}`),
      ),
    )

  const writeFile = (p: string, content: string) =>
    Effect.gen(function* () {
      const parent = p.substring(0, p.lastIndexOf("/"))
      if (parent) yield* mkdirRecursive(parent)
      yield* Effect.try({
        try: () => writeFileSync(p, content, "utf-8"),
        catch: (e) => wrapError(p, "writeFile failed", e),
      })
      yield* normalizeOwner(p)
    })

  const writeJson = (p: string, data: unknown) =>
    writeFile(p, JSON.stringify(data, null, 2) + "\n")

  const copyDir = (src: string, dest: string) =>
    Effect.gen(function* () {
      yield* mkdirRecursive(dest)
      yield* Effect.try({
        try: () => cpSync(src, dest, { recursive: true }),
        catch: (e) => wrapError(src, `copyDir to ${dest} failed`, e),
      })
      yield* normalizeOwner(dest)
    })

  const exists = (p: string) => Effect.sync(() => existsSync(p))

  const listDir = (p: string) =>
    Effect.sync(() => {
      if (!existsSync(p)) return [] as ReadonlyArray<string>
      return readdirSync(p).filter((s) => !s.startsWith(".")) as ReadonlyArray<string>
    })

  const listDirEntries = (p: string) =>
    Effect.try({
      try: () =>
        readdirSync(p, { withFileTypes: true })
          .filter((entry) => !entry.name.startsWith("."))
          .map(
            (entry): DirectoryEntry => ({
              name: entry.name,
              kind: entry.isDirectory()
                ? "directory"
                : entry.isFile()
                  ? "file"
                  : "other",
            }),
          ),
      catch: (error) => wrapError(p, "listDirEntries failed", error),
    })

  const walkDir = (p: string) =>
    Effect.sync(() => {
      if (!existsSync(p)) return [] as ReadonlyArray<string>

      const pending = [p]
      const files: string[] = []
      while (pending.length > 0) {
        const current = pending.pop()
        if (current === undefined) continue

        let entries: ReadonlyArray<Dirent<string>>
        try {
          entries = readdirSync(current, { withFileTypes: true })
        } catch {
          continue
        }

        for (const entry of entries) {
          const fullPath = path.join(current, entry.name)
          if (entry.isDirectory()) pending.push(fullPath)
          else if (entry.isFile()) files.push(fullPath)
        }
      }
      return files
    })

  const removeDir = (p: string) =>
    Effect.try({
      try: () => rmSync(p, { recursive: true, force: true }),
      catch: (e) => wrapError(p, "removeDir failed", e),
    })

  const removePath = (p: string) =>
    Effect.try({
      try: () => rmSync(p, { recursive: true, force: true }),
      catch: (e) => wrapError(p, "removePath failed", e),
    })

  const appendFile = (p: string, content: string) =>
    Effect.gen(function* () {
      const parent = p.substring(0, p.lastIndexOf("/"))
      if (parent) yield* mkdirRecursive(parent)
      yield* Effect.try({
        try: () => appendFileSync(p, content, "utf-8"),
        catch: (e) => wrapError(p, "appendFile failed", e),
      })
      yield* normalizeOwner(p)
    })

  return {
    mkdir,
    mkdirRecursive,
    readFile,
    readJson,
    writeFile,
    writeJson,
    copyDir,
    exists,
    listDir,
    listDirEntries,
    walkDir,
    removeDir,
    removePath,
    appendFile,
  }
}

export const FileSystemServiceLive = Layer.effect(
  FileSystemService,
  Effect.sync(makeFileSystemService),
)

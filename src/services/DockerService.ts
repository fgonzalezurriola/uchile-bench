import { Context, Effect, Layer } from "effect"
import { spawn } from "node:child_process"
import {
  closeSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  readSync,
  rmSync,
} from "node:fs"
import os from "node:os"
import path from "node:path"
import { DockerError } from "../domain/Errors.js"

export interface DockerMount {
  readonly hostPath: string
  readonly containerPath: string
  readonly readOnly?: boolean
}

export interface DockerEnv {
  readonly key: string
  readonly value: string
}

export interface DockerRunArgs {
  readonly image: string
  readonly mounts: ReadonlyArray<DockerMount>
  readonly env: ReadonlyArray<DockerEnv>
  readonly workDir: string
  readonly command: ReadonlyArray<string>
  readonly timeoutMs: number
  readonly cpuLimit?: string
  readonly memoryLimit?: string
  readonly pidsLimit?: number
  readonly networkMode?: string
  readonly extraArgs?: ReadonlyArray<string>
  readonly stdoutPath?: string
  readonly stderrPath?: string
}

export interface DockerRunResult {
  readonly exitCode: number | null
  readonly stdout: string
  readonly stderr: string
  readonly stdoutPath?: string
  readonly stderrPath?: string
  readonly timedOut: boolean
}

export interface DockerService {
  readonly isAvailable: Effect.Effect<boolean>
  readonly buildImage: (dockerfile: string, tag: string, contextDir?: string) => Effect.Effect<void, DockerError>
  readonly runContainer: (args: DockerRunArgs) => Effect.Effect<DockerRunResult, DockerError>
  readonly imageExists: (tag: string) => Effect.Effect<boolean>
}

export const DockerService = Context.Service<DockerService>("DockerService")

function makeDockerService(): DockerService {
  const shellQuote = (value: string): string =>
    `'${value.replaceAll("'", "'\\''")}'`

  const containerTimeoutCommand = (
    command: ReadonlyArray<string>,
    timeoutMs: number,
  ): ReadonlyArray<string> => [
    "timeout",
    "--kill-after=10s",
    `${Math.max(1, Math.ceil(timeoutMs / 1000))}s`,
    ...command,
  ]

  const cleanupWrappedCommand = (
    command: ReadonlyArray<string>,
    timeoutMs: number,
    cleanupPaths: ReadonlyArray<string>,
  ): ReadonlyArray<string> => [
    "sh",
    "-c",
    [
      '"$@"',
      "status=$?",
      cleanupPaths.length === 0
        ? ":"
        : `chmod -R a+rwX ${cleanupPaths.map(shellQuote).join(" ")} 2>/dev/null || true`,
      'exit "$status"',
    ].join("; "),
    "ai-task-bench-runner",
    ...containerTimeoutCommand(command, timeoutMs),
  ]

  const isTimeoutExitCode = (exitCode: number): boolean =>
    exitCode === 124 || exitCode === 137

  const readPreview = (filePath: string): string => {
    const fd = openSync(filePath, "r")
    try {
      const buffer = Buffer.alloc(64 * 1024)
      const bytesRead = readSync(fd, buffer, 0, buffer.length, 0)
      return buffer.subarray(0, bytesRead).toString("utf8")
    } finally {
      closeSync(fd)
    }
  }

  const runDocker = (
    args: ReadonlyArray<string>,
    timeoutMs?: number,
    env?: ReadonlyArray<DockerEnv>,
    capture?: {
      readonly stdoutPath: string
      readonly stderrPath: string
    },
  ) =>
    Effect.tryPromise({
      try: () => {
        const command = timeoutMs === undefined
          ? ["docker", ...args]
          : [
              "timeout",
              "--kill-after=10s",
              `${Math.max(1, Math.ceil(timeoutMs / 1000))}s`,
              "docker",
              ...args,
            ]
        const captureDir = capture === undefined
          ? mkdtempSync(path.join(os.tmpdir(), "ai-task-bench-docker-"))
          : null
        const stdoutPath = capture?.stdoutPath ?? path.join(
          captureDir ?? os.tmpdir(),
          "stdout.log",
        )
        const stderrPath = capture?.stderrPath ?? path.join(
          captureDir ?? os.tmpdir(),
          "stderr.log",
        )
        mkdirSync(path.dirname(stdoutPath), { recursive: true })
        mkdirSync(path.dirname(stderrPath), { recursive: true })
        const stdoutFd = openSync(stdoutPath, "w")
        const stderrFd = openSync(stderrPath, "w")
        let closed = false
        const closeCaptureFiles = () => {
          if (closed) return
          closeSync(stdoutFd)
          closeSync(stderrFd)
          closed = true
        }
        const spawnEnv = env === undefined
          ? undefined
          : {
              ...process.env,
              ...Object.fromEntries(env.map((item) => [item.key, item.value])),
            }
        return new Promise<{
          readonly exitCode: number | null
          readonly stdout: string
          readonly stderr: string
          readonly stdoutPath?: string
          readonly stderrPath?: string
          readonly timedOut: boolean
        }>((resolve, reject) => {
          const proc = spawn(command[0] ?? "docker", command.slice(1), {
            stdio: ["ignore", stdoutFd, stderrFd],
            ...(spawnEnv === undefined ? {} : { env: spawnEnv }),
          })
          proc.on("error", reject)
          proc.on("close", (exitCode) => {
            closeCaptureFiles()
            const stdout = capture === undefined
              ? readFileSync(stdoutPath, "utf8")
              : readPreview(stdoutPath)
            const stderr = capture === undefined
              ? readFileSync(stderrPath, "utf8")
              : readPreview(stderrPath)
            if (captureDir !== null) rmSync(captureDir, { recursive: true, force: true })
            const processTimedOut = timeoutMs !== undefined &&
              exitCode !== null &&
              isTimeoutExitCode(exitCode)
            resolve({
              exitCode,
              stdout,
              stderr,
              ...(capture === undefined
                ? {}
                : { stdoutPath, stderrPath }),
              timedOut: processTimedOut,
            })
          })
        }).catch((error) => {
          closeCaptureFiles()
          if (captureDir !== null) rmSync(captureDir, { recursive: true, force: true })
          throw error
        })
      },
      catch: (cause) =>
        new DockerError({
          reason: `docker invocation failed: docker ${args.join(" ")}`,
          cause,
        }),
    })

  return {
    isAvailable: runDocker(["info"]).pipe(
      Effect.map((r) => r.exitCode === 0),
      Effect.catch(() => Effect.succeed(false)),
    ),

    buildImage: (dockerfile, tag, contextDir) =>
      runDocker(["build", "--network", "host", "-f", dockerfile, "-t", tag, contextDir ?? "."]).pipe(
        Effect.flatMap((r) =>
          r.exitCode !== 0
            ? Effect.fail(new DockerError({ reason: `docker build failed: ${r.stderr.slice(0, 300)}` }))
            : Effect.void,
        ),
      ),

    imageExists: (tag) =>
      runDocker(["image", "inspect", tag]).pipe(
        Effect.map((r) => r.exitCode === 0),
        Effect.catch(() => Effect.succeed(false)),
      ),

    runContainer: (args) =>
      Effect.gen(function* () {
        const dockerArgs: string[] = ["run", "--rm", "--security-opt", "no-new-privileges"]

        if (args.cpuLimit) dockerArgs.push("--cpus", args.cpuLimit)
        if (args.memoryLimit) dockerArgs.push("-m", args.memoryLimit)
        if (args.pidsLimit) dockerArgs.push("--pids-limit", String(args.pidsLimit))

        dockerArgs.push("--network", args.networkMode ?? "host")

        for (const mount of args.mounts) {
          dockerArgs.push("-v", `${mount.hostPath}:${mount.containerPath}${mount.readOnly ? ":ro" : ""}`)
        }
        for (const env of args.env) {
          dockerArgs.push("-e", env.key)
        }

        dockerArgs.push("-w", args.workDir, "-e", "HOME=/agent-home")

        if (args.extraArgs) dockerArgs.push(...args.extraArgs)

        const cleanupPaths = args.mounts
          .filter((mount) => mount.readOnly !== true)
          .map((mount) => mount.containerPath)

        dockerArgs.push(
          args.image,
          ...cleanupWrappedCommand(args.command, args.timeoutMs, cleanupPaths),
        )

        const result = yield* runDocker(
          dockerArgs,
          args.timeoutMs + 30_000,
          args.env,
          args.stdoutPath === undefined || args.stderrPath === undefined
            ? undefined
            : {
                stdoutPath: args.stdoutPath,
                stderrPath: args.stderrPath,
              },
        )
        const timedOut = result.timedOut ||
          (result.exitCode !== null && isTimeoutExitCode(result.exitCode))

        return {
          exitCode: timedOut ? null : result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
          ...(result.stdoutPath === undefined
            ? {}
            : { stdoutPath: result.stdoutPath }),
          ...(result.stderrPath === undefined
            ? {}
            : { stderrPath: result.stderrPath }),
          timedOut,
        } satisfies DockerRunResult
      }),
  }
}

export const DockerServiceLive = Layer.effect(
  DockerService,
  Effect.sync(makeDockerService),
)

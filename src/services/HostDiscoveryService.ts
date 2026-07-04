import { Context, Effect, Layer } from "effect"

export interface HostCheckResult {
  readonly name: string
  readonly available: boolean
  readonly version?: string
  readonly path?: string
  readonly notes?: string
}

export interface HostDiscoveryService {
  readonly checkDocker: () => Effect.Effect<HostCheckResult>
  readonly checkPi: () => Effect.Effect<HostCheckResult>
  readonly checkBun: () => Effect.Effect<HostCheckResult>
  readonly checkAll: () => Effect.Effect<ReadonlyArray<HostCheckResult>>
}

export const HostDiscoveryService = Context.Service<HostDiscoveryService>("HostDiscoveryService")

function makeHostDiscoveryService(): HostDiscoveryService {
  const checkBinary = (name: string): Effect.Effect<HostCheckResult> =>
    Effect.sync(() => {
      const proc = Bun.spawnSync(["which", name], { stdout: "pipe", stderr: "pipe" })
      if (proc.exitCode !== 0) return { name, available: false } satisfies HostCheckResult
      const binPath = proc.stdout.toString().trim()
      const versionProc = Bun.spawnSync([name, "--version"], { stdout: "pipe", stderr: "pipe" })
      const version =
        versionProc.exitCode === 0
          ? versionProc.stdout.toString().trim().split("\n")[0]
          : undefined
      return version === undefined
        ? ({ name, available: true, path: binPath } satisfies HostCheckResult)
        : ({
            name,
            available: true,
            path: binPath,
            version,
          } satisfies HostCheckResult)
    })

  return {
    checkDocker: () =>
      Effect.gen(function* () {
        const binary = yield* checkBinary("docker")
        if (!binary.available) return { ...binary, name: "Docker" }
        const proc = Bun.spawnSync(["docker", "info"], { stdout: "pipe", stderr: "pipe" })
        if (proc.exitCode !== 0) {
          return { ...binary, name: "Docker", notes: "Docker CLI found but daemon may not be running" } satisfies HostCheckResult
        }
        return { ...binary, name: "Docker" } satisfies HostCheckResult
      }),

    checkPi: () => checkBinary("pi").pipe(Effect.map((r) => ({ ...r, name: "Pi" }))),

    checkBun: () => checkBinary("bun").pipe(Effect.map((r) => ({ ...r, name: "Bun" }))),

    checkAll: () =>
      Effect.gen(function* () {
        return [
          yield* checkBinary("docker").pipe(Effect.map((r) => ({ ...r, name: "Docker" }))),
          yield* checkBinary("bun").pipe(Effect.map((r) => ({ ...r, name: "Bun" }))),
          yield* checkBinary("pi").pipe(Effect.map((r) => ({ ...r, name: "Pi" }))),
        ] as ReadonlyArray<HostCheckResult>
      }),
  } satisfies HostDiscoveryService
}

export const HostDiscoveryServiceLive = Layer.effect(
  HostDiscoveryService,
  Effect.sync(makeHostDiscoveryService),
)

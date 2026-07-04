import { Context, Effect, Layer, Schema } from "effect"
import path from "node:path"
import { FileSystemService } from "./FileSystemService.js"
import type { EnvironmentConfig } from "../domain/Environment.js"
import { BenchmarkConfigError, FileSystemError } from "../domain/Errors.js"
import { EnvironmentConfigSchema } from "../schemas/EnvironmentConfig.js"

export interface EnvironmentRegistryService {
  readonly listEnvironmentIds: () => Effect.Effect<ReadonlyArray<string>>
  readonly getEnvironmentConfig: (
    environmentId: string,
  ) => Effect.Effect<EnvironmentConfig, BenchmarkConfigError | FileSystemError>
}

export const EnvironmentRegistryService =
  Context.Service<EnvironmentRegistryService>("EnvironmentRegistryService")

export const EnvironmentRegistryServiceLive = Layer.effect(
  EnvironmentRegistryService,
  Effect.gen(function* () {
    const fs = yield* FileSystemService
    const environmentsRoot = path.resolve("environments")

    const listEnvironmentIds = () =>
      Effect.gen(function* () {
        const exists = yield* fs.exists(environmentsRoot)
        if (!exists) return [] as ReadonlyArray<string>
        const files = yield* fs.listDir(environmentsRoot)
        return files
          .filter((f) => f.endsWith(".json"))
          .map((f) => f.replace(".json", ""))
          .sort() as ReadonlyArray<string>
      })

    const getEnvironmentConfig = (environmentId: string) =>
      Effect.gen(function* () {
        const configPath = `${environmentsRoot}/${environmentId}.json`
        const exists = yield* fs.exists(configPath)
        if (!exists) {
          return yield* Effect.fail(
            new BenchmarkConfigError({
              reason: `Environment not found: ${environmentId}`,
            }),
          )
        }
        const raw = yield* fs.readJson<unknown>(configPath)
        return yield* Effect.try({
          try: () =>
            Schema.decodeUnknownSync(EnvironmentConfigSchema)(
              raw,
            ) as EnvironmentConfig,
          catch: (e) =>
            new BenchmarkConfigError({
              reason: `Invalid environment config ${environmentId}: ${e}`,
            }),
        })
      })

    return {
      listEnvironmentIds,
      getEnvironmentConfig,
    } satisfies EnvironmentRegistryService
  }),
)

import { Context, Effect, Layer, Schema } from "effect"
import path from "node:path"
import type { AgentAvailability, AgentConfig } from "../domain/Agent.js"
import { AgentNotFoundError } from "../domain/Errors.js"
import { AgentConfigSchema } from "../schemas/AgentConfig.js"
import { FileSystemService } from "./FileSystemService.js"

export interface AgentRegistryService {
  readonly listAgentIds: () => Effect.Effect<ReadonlyArray<string>>
  readonly getAgentConfig: (
    agentId: string,
  ) => Effect.Effect<AgentConfig, AgentNotFoundError>
  readonly checkAvailability: (
    agentId: string,
  ) => Effect.Effect<AgentAvailability>
  readonly listAvailabilities: () => Effect.Effect<ReadonlyArray<AgentAvailability>>
}

export const AgentRegistryService =
  Context.Service<AgentRegistryService>("AgentRegistryService")

export const AgentRegistryServiceLive = Layer.effect(
  AgentRegistryService,
  Effect.gen(function*() {
    const fs = yield* FileSystemService
    const agentsRoot = path.resolve("agents")

    const listAgentIds = () =>
      Effect.gen(function*() {
        if (!(yield* fs.exists(agentsRoot))) {
          return [] as ReadonlyArray<string>
        }

        const files = yield* fs.listDir(agentsRoot)
        return files
          .filter((file) => file.endsWith(".json"))
          .map((file) => file.replace(/\.json$/, ""))
          .sort()
      })

    const getAgentConfig = (
      agentId: string,
    ): Effect.Effect<AgentConfig, AgentNotFoundError> =>
      Effect.gen(function*() {
        const configPath = `${agentsRoot}/${agentId}.json`
        if (!(yield* fs.exists(configPath))) {
          return yield* Effect.fail(new AgentNotFoundError({ agentId }))
        }

        const raw = yield* fs.readJson<unknown>(configPath)
        return yield* Effect.try({
          try: () => Schema.decodeUnknownSync(AgentConfigSchema)(raw),
          catch: () => new AgentNotFoundError({ agentId }),
        })
      }).pipe(
        Effect.mapError(() => new AgentNotFoundError({ agentId })),
      )

    const checkAvailability = (agentId: string) =>
      Effect.gen(function*() {
        const configResult = yield* getAgentConfig(agentId).pipe(
          Effect.map((config) => ({ _tag: "Right" as const, config })),
          Effect.catch((error: unknown) =>
            Effect.succeed({ _tag: "Left" as const, error }),
          ),
        )

        if (configResult._tag === "Left") {
          const reason = configResult.error instanceof Error
            ? configResult.error.message
            : String(configResult.error)
          return {
            agentId,
            available: false,
            reason: `Config not found: ${reason}`,
          } satisfies AgentAvailability
        }

        const config = configResult.config
        const pi = Bun.spawnSync(["which", "pi"], {
          stdout: "pipe",
          stderr: "pipe",
        })
        if (pi.exitCode !== 0) {
          return {
            agentId,
            available: false,
            reason: "pi CLI not found",
          } satisfies AgentAvailability
        }

        const home = process.env.HOME ?? "/root"

        if (config.provider === "openai-codex") {
          const authPath = path.join(
            home,
            ".ai-task-bench",
            "pi-openai-codex",
            "auth.json",
          )
          if (!(yield* fs.exists(authPath))) {
            return {
              agentId,
              available: false,
              reason: "Pi OpenAI subscription directory is not initialized",
            } satisfies AgentAvailability
          }
        } else if (config.provider === "opencode") {
          const hasAuth = config.apiKey !== undefined ||
            process.env.OPENCODE_API_KEY !== undefined ||
            (yield* fs.exists(path.join(home, ".local/share/opencode/auth.json"))) ||
            (yield* fs.exists(path.join(home, ".pi/agent/auth.json")))

          if (!hasAuth) {
            return {
              agentId,
              available: false,
              reason: "OpenCode authentication is not configured",
            } satisfies AgentAvailability
          }
        } else {
          const hasRequiredEnv = config.envAllowlist.some((key) => {
            const value = process.env[key]
            return value !== undefined && value.length > 0
          })
          if (config.envAllowlist.length > 0 && !hasRequiredEnv) {
            return {
              agentId,
              available: false,
              reason: `Need at least one env var: ${config.envAllowlist.join(", ")}`,
            } satisfies AgentAvailability
          }
        }

        return { agentId, available: true } satisfies AgentAvailability
      })

    const listAvailabilities = () =>
      Effect.gen(function*() {
        const ids = yield* listAgentIds()
        const results: AgentAvailability[] = []
        for (const id of ids) {
          results.push(yield* checkAvailability(id))
        }
        return results as ReadonlyArray<AgentAvailability>
      })

    return {
      listAgentIds,
      getAgentConfig,
      checkAvailability,
      listAvailabilities,
    } satisfies AgentRegistryService
  }),
)

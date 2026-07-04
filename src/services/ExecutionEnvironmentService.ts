import { Context, Effect, Layer } from "effect"
import type { AgentConfig } from "../domain/Agent.js"
import type { ResolvedExecutionEnvironment } from "../domain/Environment.js"
import type { BenchmarkConfigError, FileSystemError } from "../domain/Errors.js"
import { EnvironmentRegistryService } from "./EnvironmentRegistryService.js"

/** Inputs used to select the effective Execution Environment for one Run. */
export interface ResolveExecutionEnvironmentOptions {
  readonly baseAgentConfig: AgentConfig
  readonly explicitEnvironmentId?: string
  readonly taskEnvironmentId?: string
}

/** Resolves environment precedence and produces one internally consistent configuration. */
export class ExecutionEnvironmentService extends Context.Service<
  ExecutionEnvironmentService,
  {
    readonly resolve: (
      options: ResolveExecutionEnvironmentOptions,
    ) => Effect.Effect<
      ResolvedExecutionEnvironment,
      BenchmarkConfigError | FileSystemError
    >
  }
>()("ExecutionEnvironmentService") {}

export const ExecutionEnvironmentServiceLive = Layer.effect(
  ExecutionEnvironmentService,
  Effect.gen(function*() {
    const registry = yield* EnvironmentRegistryService

    const resolve = Effect.fnUntraced(function*(
      options: ResolveExecutionEnvironmentOptions,
    ) {
      const environmentId =
        options.explicitEnvironmentId ?? options.taskEnvironmentId

      if (environmentId === undefined) {
        return {
          _tag: "AgentDefault",
          environmentId: null,
          agentConfig: options.baseAgentConfig,
        } satisfies ResolvedExecutionEnvironment
      }

      const profile = yield* registry.getEnvironmentConfig(environmentId)
      return {
        _tag: "EnvironmentProfile",
        environmentId,
        profile,
        agentConfig: {
          ...options.baseAgentConfig,
          dockerImage: profile.dockerImage,
          dockerfile: profile.dockerfile,
        },
      } satisfies ResolvedExecutionEnvironment
    })

    return { resolve }
  }),
)

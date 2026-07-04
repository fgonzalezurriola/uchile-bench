import { Context, Effect, Layer } from "effect"
import path from "node:path"
import type {
  AgentAdapter,
  AgentRuntimeOptions,
} from "../adapters/AgentAdapter.js"
import { getAdapter } from "../adapters/registry.js"
import type { AgentConfig } from "../domain/Agent.js"
import type { ResolvedExecutionEnvironment } from "../domain/Environment.js"
import {
  AgentAdapterNotFoundError,
  AgentInvocationError,
  type AgentNotFoundError,
  type BenchmarkConfigError,
  DockerImageUnavailableError,
  DockerUnavailableError,
  type FileSystemError,
} from "../domain/Errors.js"
import { EvidenceFile } from "../domain/Evidence.js"
import { AgentRegistryService } from "./AgentRegistryService.js"
import {
  DockerService,
  type DockerEnv,
  type DockerMount,
  type DockerRunResult,
} from "./DockerService.js"
import { ExecutionEnvironmentService } from "./ExecutionEnvironmentService.js"
import { FileSystemService } from "./FileSystemService.js"
import { HashService } from "./HashService.js"

export type AgentSelection =
  | {
      readonly _tag: "ResolvedExecutionEnvironment"
      readonly executionEnvironment: ResolvedExecutionEnvironment
    }
  | {
      readonly _tag: "CatalogAgent"
      readonly agentId: string
      readonly taskEnvironmentId?: string
      readonly explicitEnvironmentId?: string
    }

export interface AgentContainerOverrides {
  readonly environmentVariables?: ReadonlyArray<DockerEnv>
  readonly timeoutMs?: number
  readonly cpuLimit?: string
  readonly memoryLimit?: string
  readonly pidsLimit?: number
  readonly networkMode?: string
  readonly extraDockerArgs?: ReadonlyArray<string>
}

export interface AgentInvocationPreparation {
  readonly agentId: string
  readonly adapter: string
  readonly model: string
  readonly image: string
  readonly environmentId: string | null
  readonly agentConfigJson: string
  readonly command: ReadonlyArray<string>
  readonly persistedCommand: string
  readonly timeoutMs: number
}

export interface AgentInvocationOptions<E = never, R = never> {
  readonly agent: AgentSelection
  readonly prompt: string
  readonly mounts: ReadonlyArray<DockerMount>
  readonly workDir: string
  readonly agentHomePath: string
  readonly agentConfigPath: string
  readonly provenancePath?: string
  readonly capture: {
    readonly eventsPath: string
    readonly stderrPath: string
  }
  readonly runtime: AgentRuntimeOptions
  readonly container?: AgentContainerOverrides
  readonly beforeExecute?: (
    prepared: AgentInvocationPreparation,
  ) => Effect.Effect<void, E, R>
}

export interface AgentInvocationResult extends DockerRunResult {
  readonly eventsPath: string
  readonly stderrPath: string
  readonly agentConfigJson: string
  readonly agentId: string
  readonly adapter: string
  readonly model: string
  readonly image: string
  readonly environmentId: string | null
  readonly command: ReadonlyArray<string>
  readonly persistedCommand: string
}

export type AgentInvocationFailure =
  | AgentNotFoundError
  | BenchmarkConfigError
  | FileSystemError
  | AgentAdapterNotFoundError
  | DockerUnavailableError
  | DockerImageUnavailableError
  | AgentInvocationError

export class AgentInvocationService extends Context.Service<
  AgentInvocationService,
  {
    readonly invoke: <E = never, R = never>(
      options: AgentInvocationOptions<E, R>,
    ) => Effect.Effect<AgentInvocationResult, AgentInvocationFailure | E, R>
  }
>()("AgentInvocationService") {}

const isSensitiveKey = (key: string): boolean =>
  /(secret|token|password|api[_-]?key|credential|auth)/i.test(key)

const mergeEnvironment = (
  ...sources: ReadonlyArray<ReadonlyArray<DockerEnv> | undefined>
): ReadonlyArray<DockerEnv> => {
  const merged = new Map<string, string>()
  for (const source of sources) {
    for (const item of source ?? []) merged.set(item.key, item.value)
  }
  return [...merged.entries()].map(([key, value]) => ({ key, value }))
}

const redactEnvironmentProfile = (
  environment: ResolvedExecutionEnvironment,
): unknown => {
  if (environment._tag === "AgentDefault") {
    return { _tag: environment._tag, environmentId: null }
  }

  return {
    ...environment.profile,
    runtime: environment.profile.runtime === undefined
      ? undefined
      : {
          ...environment.profile.runtime,
          environmentVariables:
            environment.profile.runtime.environmentVariables?.map((item) => ({
              key: item.key,
              value: isSensitiveKey(item.key) ? "***" : item.value,
            })),
        },
  }
}

const persistedCommand = (
  command: ReadonlyArray<string>,
  config: AgentConfig,
): string => {
  const raw = command.join(" ")
  return config.apiKey === undefined ? raw : raw.replaceAll(config.apiKey, "***")
}

const piOpenAiCodexAuthDir = (): string =>
  path.join(
    process.env.HOME ?? "/root",
    ".ai-task-bench",
    "pi-openai-codex",
  )

const resolveAdapter = (
  config: AgentConfig,
): Effect.Effect<AgentAdapter, AgentAdapterNotFoundError> => {
  const adapter = getAdapter(config.type)
  return adapter === undefined
    ? Effect.fail(new AgentAdapterNotFoundError({
        agentId: config.id,
        agentType: config.type,
      }))
    : Effect.succeed(adapter)
}

export const AgentInvocationServiceLive = Layer.effect(
  AgentInvocationService,
  Effect.gen(function*() {
    const registry = yield* AgentRegistryService
    const executionEnvironments = yield* ExecutionEnvironmentService
    const docker = yield* DockerService
    const fs = yield* FileSystemService
    const hash = yield* HashService

    const resolveEnvironment = Effect.fnUntraced(function*(
      selection: AgentSelection,
    ) {
      if (selection._tag === "ResolvedExecutionEnvironment") {
        return selection.executionEnvironment
      }

      const baseAgentConfig = yield* registry.getAgentConfig(selection.agentId)
      return yield* executionEnvironments.resolve({
        baseAgentConfig,
        ...(selection.explicitEnvironmentId === undefined
          ? {}
          : { explicitEnvironmentId: selection.explicitEnvironmentId }),
        ...(selection.taskEnvironmentId === undefined
          ? {}
          : { taskEnvironmentId: selection.taskEnvironmentId }),
      })
    })

    const invoke = Effect.fnUntraced(function*<E = never, R = never>(
      options: AgentInvocationOptions<E, R>,
    ) {
      const executionEnvironment = yield* resolveEnvironment(options.agent)
      const config = executionEnvironment.agentConfig
      const adapter = yield* resolveAdapter(config)
      const image = adapter.getDockerImage(config)
      const purpose = options.runtime.purpose._tag

      if (!(yield* docker.isAvailable)) {
        return yield* Effect.fail(new DockerUnavailableError({ purpose }))
      }
      if (!(yield* docker.imageExists(image))) {
        return yield* Effect.fail(
          new DockerImageUnavailableError({ image, purpose }),
        )
      }

      yield* fs.mkdirRecursive(options.agentHomePath)
      yield* fs.mkdirRecursive(options.agentConfigPath)
      if (options.provenancePath !== undefined) {
        yield* fs.mkdirRecursive(options.provenancePath)
      }

      if (config.provider === "openai-codex") {
        const sourceAuthDir = piOpenAiCodexAuthDir()
        if (yield* fs.exists(sourceAuthDir)) {
          yield* fs.copyDir(
            sourceAuthDir,
            path.join(options.agentHomePath, ".pi", "agent"),
          )
        }
      }

      const promptAddon = adapter.getPromptAddon?.(options.runtime)
      let promptAddonMetadata: Readonly<Record<string, unknown>> | undefined
      if (promptAddon !== undefined) {
        const addonContent = yield* fs.readFile(promptAddon.sourcePath)
        const configAddonPath = `${options.agentConfigPath}/${promptAddon.file}`
        yield* fs.writeFile(configAddonPath, addonContent)
        const addonSha256 = yield* hash.hashFile(configAddonPath)
        promptAddonMetadata = {
          ...promptAddon.metadata,
          addonSha256,
        }
        yield* fs.writeJson(
          `${options.agentConfigPath}/${EvidenceFile.PROMPT_METADATA}`,
          promptAddonMetadata,
        )
        if (options.provenancePath !== undefined) {
          yield* fs.writeFile(
            `${options.provenancePath}/${EvidenceFile.AGENT_PROMPT}`,
            addonContent,
          )
          yield* fs.writeJson(
            `${options.provenancePath}/${EvidenceFile.PROMPT_METADATA}`,
            promptAddonMetadata,
          )
        }
      }

      if (executionEnvironment._tag === "EnvironmentProfile") {
        yield* fs.writeJson(
          `${options.agentConfigPath}/environment.json`,
          redactEnvironmentProfile(executionEnvironment),
        )
      }

      const agentConfigJson = yield* adapter.prepareAgentConfig(
        config,
        options.prompt,
        options.runtime,
      )
      yield* fs.writeFile(
        `${options.agentConfigPath}/adapter-config.json`,
        agentConfigJson,
      )

      const profileRuntime = executionEnvironment._tag === "EnvironmentProfile"
        ? executionEnvironment.profile.runtime
        : undefined
      const command = adapter.buildDockerCommand(
        config,
        options.prompt,
        options.runtime,
      )
      const safeCommand = persistedCommand(command, config)
      const timeoutMs = options.container?.timeoutMs ?? adapter.getTimeoutMs(config)
      const mounts = [
        ...options.mounts,
        {
          hostPath: options.agentHomePath,
          containerPath: "/agent-home",
        },
        {
          hostPath: options.agentConfigPath,
          containerPath: "/agent-config",
        },
        ...(adapter.buildDockerMounts?.(config) ?? []),
      ]
      const environmentVariables = mergeEnvironment(
        adapter.buildDockerEnv(config),
        profileRuntime?.environmentVariables,
        options.container?.environmentVariables,
      )
      const cpuLimit = options.container?.cpuLimit ?? profileRuntime?.cpuLimit ?? "2"
      const memoryLimit = options.container?.memoryLimit ??
        profileRuntime?.memoryLimit ?? "4g"
      const pidsLimit = options.container?.pidsLimit ?? profileRuntime?.pidsLimit ?? 256
      const networkMode = options.container?.networkMode ??
        profileRuntime?.networkMode ?? "host"
      const extraDockerArgs = options.container?.extraDockerArgs ??
        profileRuntime?.extraDockerArgs ?? []

      const preparation: AgentInvocationPreparation = {
        agentId: config.id,
        adapter: adapter.agentType,
        model: config.model,
        image,
        environmentId: executionEnvironment.environmentId,
        agentConfigJson,
        command,
        persistedCommand: safeCommand,
        timeoutMs,
      }

      yield* fs.writeJson(`${options.agentConfigPath}/invocation.json`, {
        version: 1,
        purpose,
        agentId: config.id,
        adapter: adapter.agentType,
        model: config.model,
        image,
        environmentId: executionEnvironment.environmentId,
        command: safeCommand,
        timeoutMs,
        cpuLimit,
        memoryLimit,
        pidsLimit,
        networkMode,
        extraDockerArgs,
        environmentVariableKeys: environmentVariables.map((item) => item.key),
        mounts: mounts.map((mount) => ({
          containerPath: mount.containerPath,
          readOnly: mount.readOnly === true,
        })),
        promptAddon: promptAddonMetadata,
      })

      if (options.beforeExecute !== undefined) {
        yield* options.beforeExecute(preparation)
      }

      const result = yield* docker.runContainer({
        image,
        mounts,
        env: environmentVariables,
        workDir: options.workDir,
        command,
        timeoutMs,
        cpuLimit,
        memoryLimit,
        pidsLimit,
        networkMode,
        extraArgs: extraDockerArgs,
        stdoutPath: options.capture.eventsPath,
        stderrPath: options.capture.stderrPath,
      }).pipe(
        Effect.mapError(
          (cause) =>
            new AgentInvocationError({
              agentId: config.id,
              reason: cause.message,
            }),
        ),
      )

      return {
        ...result,
        eventsPath: options.capture.eventsPath,
        stderrPath: options.capture.stderrPath,
        agentConfigJson,
        agentId: config.id,
        adapter: adapter.agentType,
        model: config.model,
        image,
        environmentId: executionEnvironment.environmentId,
        command,
        persistedCommand: safeCommand,
      } satisfies AgentInvocationResult
    })

    return { invoke }
  }),
)

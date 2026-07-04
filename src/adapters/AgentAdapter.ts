import { Effect } from "effect"
import type { AgentConfig } from "../domain/Agent.js"
import type { AgentEventNormalization } from "../domain/Session.js"

export type AgentInvocationPurpose =
  | { readonly _tag: "Solver" }
  | { readonly _tag: "RubricGenerator" }
  | { readonly _tag: "Judge" }

export const SOLVER_PURPOSE = { _tag: "Solver" } as const
export const RUBRIC_GENERATOR_PURPOSE = { _tag: "RubricGenerator" } as const
export const JUDGE_PURPOSE = { _tag: "Judge" } as const

export interface AgentRuntimeOptions {
  readonly purpose: AgentInvocationPurpose
  readonly thinking?: "off" | "minimal" | "low" | "medium" | "high" | "xhigh"
  readonly tools?: ReadonlyArray<string>
  readonly disableTools?: boolean
  readonly outputMode?: "text" | "json"
}

export interface AgentDockerMount {
  readonly hostPath: string
  readonly containerPath: string
  readonly readOnly?: boolean
}

/** Versioned prompt addon and safe metadata owned by an Agent Adapter. */
export interface AgentPromptAddon {
  readonly sourcePath: string
  readonly file: string
  readonly containerPath: string
  readonly metadata: Readonly<Record<string, unknown>>
}

/**
 * Interface for all agent adapters.
 * Each adapter knows how to execute a specific agent inside Docker.
 */
export interface AgentAdapter {
  readonly agentType: string
  readonly buildDockerCommand: (
    config: AgentConfig,
    prompt: string,
    runtime: AgentRuntimeOptions,
  ) => ReadonlyArray<string>
  readonly buildDockerEnv: (
    config: AgentConfig,
  ) => ReadonlyArray<{ key: string; value: string }>
  readonly buildDockerMounts?: (
    config: AgentConfig,
  ) => ReadonlyArray<AgentDockerMount>
  readonly getDockerImage: (config: AgentConfig) => string
  readonly getTimeoutMs: (config: AgentConfig) => number
  readonly getPromptAddon?: (
    runtime: AgentRuntimeOptions,
  ) => AgentPromptAddon
  readonly normalizeSessionEvents?: (
    eventsJsonl: string,
  ) => AgentEventNormalization
  readonly prepareAgentConfig: (
    config: AgentConfig,
    prompt: string,
    runtime: AgentRuntimeOptions,
  ) => Effect.Effect<string, never>
}

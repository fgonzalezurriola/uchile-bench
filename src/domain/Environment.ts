import type { AgentConfig } from "./Agent.js"
import type { EnvironmentConfig as SchemaEnvironmentConfig } from "../schemas/EnvironmentConfig.js"

export type EnvironmentConfig = SchemaEnvironmentConfig

/** Effective execution configuration selected for one Run. */
export type ResolvedExecutionEnvironment =
  | {
      readonly _tag: "AgentDefault"
      readonly environmentId: null
      readonly agentConfig: AgentConfig
    }
  | {
      readonly _tag: "EnvironmentProfile"
      readonly environmentId: string
      readonly agentConfig: AgentConfig
      readonly profile: EnvironmentConfig
    }

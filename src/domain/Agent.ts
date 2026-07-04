/**
 * Agent domain type.
 * Derives its shape from the schema (AgentConfig.ts).
 *
 * The schema is the single source of truth for the shape of an agent config.
 * This module re-exports canonical types and adds the AgentAvailability
 * interface which is a computed (not stored) type.
 */

import type { AgentConfig as SchemaAgentConfig } from "../schemas/AgentConfig.js"

// Re-export canonical types from schema
export type AgentConfig = SchemaAgentConfig

export const DEFAULT_AGENT_ID = "pi-minimax-m3-high-api"
export const DEFAULT_RUBRIC_AGENT_ID = "pi-openai-gpt-5.5-high-subscription"
export const DEFAULT_JUDGE_AGENT_ID = "pi-openai-gpt-5.5-high-subscription"

// Computed type (not stored in JSON — determined at runtime by host checks)
export interface AgentAvailability {
  readonly agentId: string
  readonly available: boolean
  readonly reason?: string
}

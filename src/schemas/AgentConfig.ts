import { Schema } from "effect"

export const AgentConfigSchema = Schema.Struct({
  id: Schema.String,
  type: Schema.String.check(Schema.isMinLength(1)),
  model: Schema.String,
  provider: Schema.String,
  thinking: Schema.Literals(["low", "medium", "high", "xhigh"]),
  apiKey: Schema.optional(Schema.String),
  timeoutMinutes: Schema.Number,
  dockerImage: Schema.String,
  dockerfile: Schema.optional(Schema.String),
  envAllowlist: Schema.Array(Schema.String),
})

/** Canonical AgentConfig type — the schema is the single source of truth. */
export type AgentConfig = Schema.Schema.Type<typeof AgentConfigSchema>

/** Agent type literal (derived from schema). */
export type AgentType = AgentConfig["type"]

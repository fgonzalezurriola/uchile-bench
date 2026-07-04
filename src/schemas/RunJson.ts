import { Schema } from "effect"

// ── Status ──
export const RunStatusSchema = Schema.Literals([
  "pending",
  "preparing",
  "copying-input",
  "collecting-before-evidence",
  "running-agent",
  "collecting-after-evidence",
  "exporting-output",
  "creating-review",
  "completed",
  "failed",
  "cancelled",
])

// ── Sub-structs ──
// NOTE: `session` is optional in JSON for backward compat with runs
// created before this field existed. The domain layer enforces it as required.
export const RunPathsSchema = Schema.Struct({
  input: Schema.String,
  workspace: Schema.String,
  agentHome: Schema.String,
  agentConfig: Schema.String,
  output: Schema.String,
  evidence: Schema.String,
  review: Schema.String,
  session: Schema.optional(Schema.String),
})

export const RunHashesSchema = Schema.Struct({
  inputHash: Schema.NullOr(Schema.String),
  outputHash: Schema.NullOr(Schema.String),
})

export const RunEvidenceSchema = Schema.Struct({
  treeBefore: Schema.NullOr(Schema.String),
  treeAfter: Schema.NullOr(Schema.String),
  filesBefore: Schema.NullOr(Schema.String),
  filesAfter: Schema.NullOr(Schema.String),
  diffPatch: Schema.NullOr(Schema.String),
  stdoutLog: Schema.NullOr(Schema.String),
  stderrLog: Schema.NullOr(Schema.String),
  eventsJsonl: Schema.NullOr(Schema.String),
})

export const RunAgentInfoSchema = Schema.Struct({
  adapter: Schema.String,
  model: Schema.NullOr(Schema.String),
  command: Schema.NullOr(Schema.String),
})

export const RunMetricsSchema = Schema.Struct({
  totalTurns: Schema.NullOr(Schema.Number),
  totalToolCalls: Schema.NullOr(Schema.Number),
  totalTokens: Schema.NullOr(Schema.Number),
  inputTokens: Schema.NullOr(Schema.Number),
  outputTokens: Schema.NullOr(Schema.Number),
  reasoningTokens: Schema.NullOr(Schema.Number),
  costUsd: Schema.NullOr(Schema.Number),
  totalThinkingChars: Schema.NullOr(Schema.Number),
})

const LegacyRunErrorSchema = Schema.Struct({
  message: Schema.String,
  code: Schema.optional(Schema.String),
})

// ── Top-level Run JSON ──
// `metrics` is optional for backward compat. Legacy interrupted runs stored a
// structured error object, which the run store normalizes to its message.
export const RunJsonSchema = Schema.Struct({
  runId: Schema.String,
  taskId: Schema.String,
  agentId: Schema.String,
  environmentId: Schema.optional(Schema.NullOr(Schema.String)),
  status: RunStatusSchema,
  startedAt: Schema.NullOr(Schema.String),
  finishedAt: Schema.NullOr(Schema.String),
  durationSeconds: Schema.NullOr(Schema.Number),
  paths: RunPathsSchema,
  hashes: RunHashesSchema,
  evidence: RunEvidenceSchema,
  agent: RunAgentInfoSchema,
  metrics: Schema.optional(RunMetricsSchema),
  error: Schema.NullOr(
    Schema.Union([Schema.String, LegacyRunErrorSchema]),
  ),
})

// ── Canonical derived types (relaxed — tolerate missing fields) ──
// For the JSON-on-disk representation.
// The domain module re-exports these and adds factory functions.

export type RunStatus = Schema.Schema.Type<typeof RunStatusSchema>
export type RunPaths = Schema.Schema.Type<typeof RunPathsSchema>
export type RunHashes = Schema.Schema.Type<typeof RunHashesSchema>
export type RunEvidence = Schema.Schema.Type<typeof RunEvidenceSchema>
export type RunAgentInfo = Schema.Schema.Type<typeof RunAgentInfoSchema>
export type RunMetrics = Schema.Schema.Type<typeof RunMetricsSchema>
export type Run = Schema.Schema.Type<typeof RunJsonSchema>

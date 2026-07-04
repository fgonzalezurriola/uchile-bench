/**
 * Run domain type.
 * Derives its shape from the schema (RunJson.ts) and adds factory functions.
 *
 * The schema is the single source of truth for the shape of a Run on disk.
 * This module enforces stricter invariants for in-memory use (e.g. `session`
 * is required in code even though it may be absent in legacy JSON files).
 */

import type {
  Run as SchemaRun,
  RunPaths as SchemaRunPaths,
  RunHashes as SchemaRunHashes,
  RunEvidence as SchemaRunEvidence,
  RunAgentInfo as SchemaRunAgentInfo,
  RunMetrics as SchemaRunMetrics,
  RunStatus as SchemaRunStatus,
} from "../schemas/RunJson.js"

// Re-export scalar types unchanged
export type RunStatus = SchemaRunStatus
export type RunHashes = SchemaRunHashes
export type RunEvidence = SchemaRunEvidence
export type RunAgentInfo = SchemaRunAgentInfo
export type RunMetrics = SchemaRunMetrics

// ── RunPaths — make `session` required (always present for new runs) ──
export interface RunPaths extends Omit<SchemaRunPaths, "session"> {
  session: string
}

// ── Run — enforce normalized invariants after loading legacy JSON ──
export interface Run
  extends Omit<
    SchemaRun,
    "paths" | "metrics" | "error" | "environmentId"
  > {
  readonly environmentId: string | null
  readonly paths: RunPaths
  readonly metrics: RunMetrics
  readonly error: string | null
}

// ── Factory ──
/** Create a fresh run with default values (for new benchmark executions). */
export const makeRun = (
  runId: string,
  taskId: string,
  agentId: string,
  paths: RunPaths,
  environmentId: string | null = null,
): Run => ({
  runId,
  taskId,
  agentId,
  environmentId,
  status: "pending",
  startedAt: null,
  finishedAt: null,
  durationSeconds: null,
  paths,
  hashes: { inputHash: null, outputHash: null },
  evidence: {
    treeBefore: null,
    treeAfter: null,
    filesBefore: null,
    filesAfter: null,
    diffPatch: null,
    stdoutLog: null,
    stderrLog: null,
    eventsJsonl: null,
  },
  agent: { adapter: agentId, model: null, command: null },
  metrics: {
    totalTurns: null,
    totalToolCalls: null,
    totalTokens: null,
    inputTokens: null,
    outputTokens: null,
    reasoningTokens: null,
    costUsd: null,
    totalThinkingChars: null,
  },
  error: null,
})

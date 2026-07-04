import type { Run } from "./Run.js"
import type { RunInputSource } from "../programs/prepareRun.js"

/** Result of one independent attempt at a standalone target. */
export type StandaloneRunAttempt =
  | {
      readonly _tag: "Completed"
      readonly sequence: number
      readonly run: Run
    }
  | {
      readonly _tag: "Failed"
      readonly sequence: number
      readonly runId: string | null
      readonly runDir: string | null
      readonly error: string
    }

/** Persisted result for one stage in a cumulative sequence run. */
export interface CumulativeStageRunRecord {
  readonly index: number
  readonly stageKey: string
  readonly taskId: string
  readonly status: "completed" | "failed" | "skipped"
  readonly runId: string | null
  readonly runDir: string | null
  readonly outputPath: string | null
  readonly inputSource: RunInputSource | null
  readonly error: string | null
}

/** Persisted record for one independent cumulative sequence run. */
export interface CumulativeRunRecord {
  readonly sequenceRunId: string
  readonly targetId: string
  readonly agentId: string
  readonly environmentId: string | null
  readonly status: "running" | "completed" | "failed"
  readonly startedAt: string
  readonly finishedAt: string | null
  readonly stages: ReadonlyArray<CumulativeStageRunRecord>
}

/** Result returned after executing a resolved benchmark target. */
export type TargetRunResult =
  | {
      readonly _tag: "Standalone"
      readonly targetId: string
      readonly attempts: ReadonlyArray<StandaloneRunAttempt>
    }
  | {
      readonly _tag: "Cumulative"
      readonly targetId: string
      readonly runs: ReadonlyArray<CumulativeRunRecord>
    }

/** Whether every requested execution for a target completed successfully. */
export const isTargetRunSuccessful = (result: TargetRunResult): boolean =>
  result._tag === "Standalone"
    ? result.attempts.every((attempt) => attempt._tag === "Completed")
    : result.runs.every((run) => run.status === "completed")

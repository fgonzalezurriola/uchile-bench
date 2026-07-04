import { Data } from "effect"

/** Requested task does not exist. Retained for legacy API compatibility. */
export class TaskNotFoundError extends Data.TaggedError("TaskNotFoundError")<{
  readonly taskId: string
}> {
  override get message() {
    return `Task not found: ${this.taskId}`
  }
}

/** Requested benchmark target does not exist. */
export class BenchmarkTargetNotFoundError extends Data.TaggedError(
  "BenchmarkTargetNotFoundError",
)<{
  readonly targetId: string
}> {
  override get message() {
    return `Benchmark target not found: ${this.targetId}`
  }
}

/** A task or sequence manifest could not be parsed. */
export class BenchmarkManifestError extends Data.TaggedError(
  "BenchmarkManifestError",
)<{
  readonly path: string
  readonly reason: string
  readonly cause?: unknown
}> {
  override get message() {
    return `Invalid benchmark manifest at ${this.path}: ${this.reason}`
  }
}

/** Benchmark directories violate the supported catalog layout. */
export class BenchmarkLayoutError extends Data.TaggedError(
  "BenchmarkLayoutError",
)<{
  readonly path: string
  readonly reason: string
}> {
  override get message() {
    return `Invalid benchmark layout at ${this.path}: ${this.reason}`
  }
}

/** Requested agent configuration does not exist. */
export class AgentNotFoundError extends Data.TaggedError("AgentNotFoundError")<{
  readonly agentId: string
}> {
  override get message() {
    return `Agent not found: ${this.agentId}`
  }
}

/** Requested run record does not exist. */
export class RunNotFoundError extends Data.TaggedError("RunNotFoundError")<{
  readonly runId: string
}> {
  override get message() {
    return `Run not found: ${this.runId}`
  }
}

/** Docker operation failed. */
export class DockerError extends Data.TaggedError("DockerError")<{
  readonly reason: string
  readonly cause?: unknown
}> {
  override get message() {
    return `Docker error: ${this.reason}`
  }
}

/** Spawned process exited unsuccessfully. */
export class ProcessError extends Data.TaggedError("ProcessError")<{
  readonly command: string
  readonly exitCode: number | null
  readonly stderr: string
}> {
  override get message() {
    return `Process failed: ${this.command} (exit=${this.exitCode ?? "N/A"}): ${this.stderr.slice(0, 200)}`
  }
}

/** Filesystem operation failed. */
export class FileSystemError extends Data.TaggedError("FileSystemError")<{
  readonly path: string
  readonly reason: string
  readonly cause?: unknown
}> {
  override get message() {
    return `Filesystem error at ${this.path}: ${this.reason}`
  }
}

/** A raw agent event stream could not be converted into retained session artifacts. */
export class SessionCompactionError extends Data.TaggedError(
  "SessionCompactionError",
)<{
  readonly sourcePath: string
  readonly sessionPath: string
  readonly reason: string
  readonly cause?: unknown
}> {
  override get message() {
    return `Session compaction failed for ${this.sourcePath}: ${this.reason}`
  }
}

/** A retained session cannot be rebuilt because its transient raw event stream is gone. */
export class SessionRawUnavailableError extends Data.TaggedError(
  "SessionRawUnavailableError",
)<{
  readonly runId: string
  readonly evidencePath: string
  readonly sessionPath: string
}> {
  override get message() {
    return `Cannot rebuild session for run ${this.runId}: the transient raw Pi log is unavailable and no complete published session exists at ${this.sessionPath}`
  }
}

/** Agent process failed during a benchmark run. */
export class AgentExecutionError extends Data.TaggedError("AgentExecutionError")<{
  readonly agentId: string
  readonly runId: string
  readonly reason: string
}> {
  override get message() {
    return `Agent execution failed (${this.agentId}, run ${this.runId}): ${this.reason}`
  }
}

/** A task stage failed after its auditable run directory was created. */
export class TaskStageRunError extends Data.TaggedError("TaskStageRunError")<{
  readonly runId: string
  readonly runDir: string
  readonly outputPath: string
  readonly reason: string
  readonly cause: unknown
}> {
  override get message() {
    return `Task stage run ${this.runId} failed: ${this.reason}`
  }
}

/** Benchmark or adapter configuration is unsupported. */
export class BenchmarkConfigError extends Data.TaggedError(
  "BenchmarkConfigError",
)<{
  readonly reason: string
}> {
  override get message() {
    return `Configuration error: ${this.reason}`
  }
}

/** A generated or manually edited rubric violates benchmark invariants. */
export class RubricValidationError extends Data.TaggedError(
  "RubricValidationError",
)<{
  readonly path: string
  readonly reason: string
  readonly cause?: unknown
}> {
  override get message() {
    return `Invalid rubric at ${this.path}: ${this.reason}`
  }
}

/** An AI judge verdict violates its schema or the approved rubric. */
export class JudgeVerdictValidationError extends Data.TaggedError(
  "JudgeVerdictValidationError",
)<{
  readonly path: string
  readonly reason: string
  readonly cause?: unknown
}> {
  override get message() {
    return `Invalid judge verdict at ${this.path}: ${this.reason}`
  }
}

/** An Agent Adapter could not be resolved for a configured agent. */
export class AgentAdapterNotFoundError extends Data.TaggedError(
  "AgentAdapterNotFoundError",
)<{
  readonly agentId: string
  readonly agentType: string
}> {
  override get message() {
    return `Agent adapter not found (${this.agentId}): ${this.agentType}`
  }
}

/** Docker is required for an isolated agent invocation but is unavailable. */
export class DockerUnavailableError extends Data.TaggedError(
  "DockerUnavailableError",
)<{
  readonly purpose: "Solver" | "RubricGenerator" | "Judge"
}> {
  override get message() {
    return `Docker is unavailable for ${this.purpose}`
  }
}

/** The selected immutable image is not available locally. */
export class DockerImageUnavailableError extends Data.TaggedError(
  "DockerImageUnavailableError",
)<{
  readonly image: string
  readonly purpose: "Solver" | "RubricGenerator" | "Judge"
}> {
  override get message() {
    return `Docker image is not available for ${this.purpose}: ${this.image}`
  }
}

/** An agent invocation failed after configuration was resolved. */
export class AgentInvocationError extends Data.TaggedError(
  "AgentInvocationError",
)<{
  readonly agentId: string
  readonly reason: string
}> {
  override get message() {
    return `Agent invocation failed (${this.agentId}): ${this.reason}`
  }
}

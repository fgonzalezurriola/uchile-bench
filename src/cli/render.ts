import type {
  ExperimentJudgeItem,
  ExperimentStatus,
  ProgressView,
  RebuildSessionResult,
  RunInspection,
} from "../application/BenchmarkOperations.js"
import type { AgentAvailability } from "../domain/Agent.js"
import type { BenchmarkTarget } from "../domain/BenchmarkTarget.js"
import type { SessionRawUnavailableError } from "../domain/Errors.js"
import type { Run } from "../domain/Run.js"
import type { EnvironmentConfig } from "../schemas/EnvironmentConfig.js"
import type { HostCheckResult } from "../services/HostDiscoveryService.js"
import type { BatchTargetResult } from "../programs/runAll.js"

const summarizeExperimentRunResult = (result: ReadonlyArray<BatchTargetResult>) => {
  const completed = result.filter((item) => item._tag === "Completed")
  const failed = result.filter((item) => item._tag === "Failed")
  return { completed, failed }
}

export const renderTargets = (targets: ReadonlyArray<BenchmarkTarget>): void => {
  if (targets.length === 0) {
    console.log("No Benchmark Targets found.")
    return
  }
  for (const target of targets) {
    const kind = target._tag === "StandaloneTask"
      ? "standalone"
      : `cumulative (${target.stages.length} stages)`
    console.log(`  ${target.id}  [${kind}]  ${target.title}`)
    console.log(`    ${target.description}`)
  }
}

export const renderAgents = (
  agents: ReadonlyArray<AgentAvailability>,
): void => {
  if (agents.length === 0) {
    console.log("No agents found. Add JSON configs to agents/.")
    return
  }
  for (const agent of agents) {
    const reason = agent.reason === undefined ? "" : ` (${agent.reason})`
    console.log(`  ${agent.available ? "✓" : "✗"} ${agent.agentId}${reason}`)
  }
}

export const renderEnvironments = (
  environments: ReadonlyArray<EnvironmentConfig>,
): void => {
  if (environments.length === 0) {
    console.log("No Execution Environments found.")
    return
  }
  for (const environment of environments) {
    console.log(`  ${environment.id}  ${environment.dockerImage}`)
    console.log(`    Dockerfile: ${environment.dockerfile}`)
  }
}

export const renderRuns = (runs: ReadonlyArray<Run>): void => {
  if (runs.length === 0) {
    console.log("No Runs found.")
    return
  }
  console.log(
    "RUN ID".padEnd(30) + "TASK".padEnd(20) + "AGENT".padEnd(15) +
      "STATUS".padEnd(15) + "DURATION",
  )
  console.log("-".repeat(95))
  for (const run of runs) {
    const duration = run.durationSeconds === null
      ? "-"
      : `${run.durationSeconds.toFixed(1)}s`
    console.log(
      run.runId.padEnd(30) + run.taskId.padEnd(20) + run.agentId.padEnd(15) +
        run.status.padEnd(15) + duration,
    )
  }
}

export const renderInspection = (inspection: RunInspection): void => {
  const run = inspection.run
  console.log(`Run: ${run.runId}`)
  console.log(`Task: ${run.taskId}`)
  console.log(`Agent: ${run.agentId}`)
  console.log(`Status: ${run.status}`)
  console.log(`Started: ${run.startedAt ?? "-"}`)
  console.log(`Finished: ${run.finishedAt ?? "-"}`)
  console.log(
    `Duration: ${run.durationSeconds === null ? "-" : `${run.durationSeconds.toFixed(1)}s`}`,
  )
  console.log("\nPaths:")
  for (const [key, value] of Object.entries(run.paths)) console.log(`  ${key}: ${value}`)
  console.log("\nHashes:")
  console.log(`  input:  ${run.hashes.inputHash ?? "-"}`)
  console.log(`  output: ${run.hashes.outputHash ?? "-"}`)
  console.log("\nEvidence:")
  for (const [key, value] of Object.entries(run.evidence)) {
    console.log(`  ${key}: ${value ?? "-"}`)
  }
  console.log("\nAgent invocation:")
  console.log(`  adapter: ${run.agent.adapter}`)
  console.log(`  model:   ${run.agent.model ?? "-"}`)
  console.log(`  command: ${run.agent.command ?? "-"}`)
  console.log("\nMetrics:")
  console.log(`  Turns: ${run.metrics.totalTurns ?? "-"}`)
  console.log(`  Tool Calls: ${run.metrics.totalToolCalls ?? "-"}`)
  console.log(`  Total Tokens: ${run.metrics.totalTokens ?? "-"}`)
  console.log(
    `  Cost: ${run.metrics.costUsd === null ? "-" : `$${run.metrics.costUsd.toFixed(4)}`}`,
  )
  if (run.error !== null) console.log(`\nError: ${run.error}`)
  console.log(`\nManual Review: ${inspection.manualReviewExists ? "initialized" : "missing"}`)
  if (inspection.aiReviews.length > 0) {
    console.log("AI Reviews:")
    for (const review of inspection.aiReviews) {
      const grade = review.grade === undefined ? "" : ` grade ${review.grade.toFixed(1)}`
      const confidence = review.confidence === undefined
        ? ""
        : ` confidence ${review.confidence}`
      console.log(`  ${review.agentId}: ${review.status}${grade}${confidence}`)
      console.log(`    ${review.reviewPath}/review.md`)
    }
  }
  const sessionFiles = [
    inspection.session.compactJsonExists ? "session.compact.json" : null,
    inspection.session.htmlExists ? "session.html" : null,
    inspection.session.metricsExists ? "metrics.json" : null,
  ].filter((file): file is string => file !== null)
  if (sessionFiles.length > 0) console.log(`Session: ${sessionFiles.join(", ")}`)
}

export const renderSessionRebuild = (result: RebuildSessionResult): void => {
  if (result.status === "rebuilt") {
    console.log(`Session rebuilt at ${result.runDir}/07-session/`)
    console.log(
      `  session.compact.json, metrics.json${result.htmlGenerated ? ", session.html" : ""}`,
    )
    return
  }
  console.log(`Session already published at ${result.runDir}/07-session/`)
  console.log("  Raw transient log unavailable; retained compact artifacts were not changed.")
  console.log(`  ${result.compactJsonPath}`)
  console.log(`  ${result.metricsPath}`)
  if (result.htmlPath !== null) console.log(`  ${result.htmlPath}`)
}

export const renderSessionRawUnavailable = (
  error: SessionRawUnavailableError,
): void => {
  console.error(`Session raw unavailable: ${error.message}`)
  console.error(`  Evidence: ${error.evidencePath}`)
}

export const renderDoctor = (
  hostChecks: ReadonlyArray<HostCheckResult>,
  agents: ReadonlyArray<AgentAvailability>,
): void => {
  console.log("Host Checks:")
  console.log("-".repeat(60))
  for (const check of hostChecks) {
    const version = check.version === undefined ? "" : ` v${check.version}`
    const binaryPath = check.path === undefined ? "" : ` (${check.path})`
    const notes = check.notes === undefined ? "" : ` — ${check.notes}`
    console.log(
      `  ${check.available ? "✓" : "✗"} ${check.name}${version}${binaryPath}${notes}`,
    )
  }
  console.log("\nAgent Adapters:")
  console.log("-".repeat(60))
  renderAgents(agents)
}

export const renderProgress = (progress: ProgressView): void => {
  console.log("\nBenchmark Progress")
  console.log("=".repeat(60))
  for (const item of progress.items) {
    const icon = item.current ? "▶" : item.completed ? "✓" : "○"
    const kind = item.target._tag === "StandaloneTask" ? "standalone" : "cumulative"
    console.log(`  ${icon} ${item.target.id} [${kind}]${item.current ? " (running)" : ""}`)
  }
  console.log(`\n  ${progress.completedCount}/${progress.totalCount} targets completed\n`)
}

export const renderExperimentStatus = (status: ExperimentStatus): void => {
  const runIdWidth = Math.max(
    "RUN ID".length,
    ...status.runs.map((item) => item.runId.length),
  ) + 2
  console.log(`Experiment agent: ${status.solverAgentId}`)
  if (status.prefix !== undefined) console.log(`Prefix: ${status.prefix}`)
  if (status.runs.length === 0) {
    console.log("No matching runs found.")
    return
  }

  console.log(
    "TASK".padEnd(14) + "RUN ID".padEnd(runIdWidth) + "STATUS".padEnd(13) + "DURATION".padEnd(11) +
      "TOKENS".padEnd(12) + "COST".padEnd(10) + "AI REVIEWS",
  )
  console.log("-".repeat(90 + runIdWidth))
  for (const item of status.runs) {
    const duration = item.durationSeconds === null
      ? "-"
      : `${item.durationSeconds.toFixed(1)}s`
    const tokens = item.totalTokens === null ? "-" : String(item.totalTokens)
    const cost = item.costUsd === null ? "-" : `$${item.costUsd.toFixed(4)}`
    const reviews = item.aiReviews.length === 0
      ? "-"
      : item.aiReviews
        .map((review) => {
          const grade = review.grade === undefined ? "" : ` ${review.grade.toFixed(1)}`
          return `${review.agentId}:${review.status}${grade}`
        })
        .join(", ")
    console.log(
      item.taskId.padEnd(14) + item.runId.padEnd(runIdWidth) + item.status.padEnd(13) +
        duration.padEnd(11) + tokens.padEnd(12) + cost.padEnd(10) + reviews,
    )
  }
}

export const renderExperimentRun = (result: ReadonlyArray<BatchTargetResult>): void => {
  const summary = summarizeExperimentRunResult(result)
  console.log("")
  if (result.length === 0) {
    console.log("Experiment run finished: no pending Benchmark Targets.")
    return
  }

  console.log(
    `Experiment run finished: ${summary.completed.length} completed, ${summary.failed.length} failed.`,
  )

  if (summary.failed.length === 0) return

  console.log("")
  console.log("Failed targets:")
  for (const item of summary.failed) {
    console.log(`  ${item.targetId}: ${item.error}`)
  }
}

export const renderExperimentJudge = (
  results: ReadonlyArray<ExperimentJudgeItem>,
): void => {
  if (results.length === 0) {
    console.log("No matching completed runs found to judge.")
    return
  }

  console.log(
    "TASK".padEnd(14) + "STATUS".padEnd(12) + "GRADE".padEnd(8) +
      "CONF".padEnd(8) + "DETAIL",
  )
  console.log("-".repeat(90))
  for (const item of results) {
    const grade = item.grade === undefined ? "-" : item.grade.toFixed(1)
    const confidence = item.confidence ?? "-"
    const detail = item.reviewPath ?? item.error ?? item.runId
    console.log(
      item.taskId.padEnd(14) + item.status.padEnd(12) +
        grade.padEnd(8) + confidence.padEnd(8) + detail,
    )
  }
}

import { cac } from "cac"
import { Effect } from "effect"
import path from "node:path"
import {
  approveRubricDraft,
  buildDockerImages,
  createManualReview,
  generateRubricDraft,
  getExperimentStatus,
  getProgress,
  inspectRun,
  judgeExperiment,
  judgeLocatedRun,
  listAgents,
  listBenchmarkTargets,
  listExecutionEnvironments,
  listRuns,
  rebuildSession,
  runDoctor,
  runExperiment,
  resumeCumulativeTargetRun,
  startAllBenchmarkTargets,
  startBenchmarkTarget,
} from "../application/BenchmarkOperations.js"
import { runApplication } from "../application/runtime.js"
import {
  DEFAULT_AGENT_ID,
  DEFAULT_JUDGE_AGENT_ID,
  DEFAULT_RUBRIC_AGENT_ID,
} from "../domain/Agent.js"
import { SessionRawUnavailableError } from "../domain/Errors.js"
import { parseRunCount } from "../domain/RunCount.js"
import {
  renderAgents,
  renderDoctor,
  renderEnvironments,
  renderExperimentJudge,
  renderExperimentRun,
  renderExperimentStatus,
  renderInspection,
  renderProgress,
  renderRuns,
  renderSessionRawUnavailable,
  renderSessionRebuild,
  renderTargets,
} from "./render.js"

const cli = cac("bench")
const runsRoot = path.resolve("runs")

const parseTimeoutMs = (value: string | number | undefined): number | undefined => {
  if (value === undefined) return undefined
  const minutes = Number(value)
  if (!Number.isInteger(minutes) || minutes < 1) {
    throw new Error(`Invalid --timeout-minutes value: ${value}`)
  }
  return minutes * 60 * 1000
}

cli
  .command(
    "run [targetId]",
    "Run a Benchmark Target. Without targetId, run all incomplete targets.",
  )
  .option("--agent <agentId>", "Agent to use", { default: DEFAULT_AGENT_ID })
  .option("--environment <environmentId>", "Execution Environment")
  .option("--runs <n>", "Number of independent Runs", { default: "1" })
  .option("--prompt <prompt>", "Custom prompt override")
  .option("--reset", "Reset Progress before batch execution")
  .option("--prefix <prefix>", "Filter targets by Target Catalog prefix")
  .option("--concurrency <n>", "Number of targets to run concurrently")
  .option("--timeout-minutes <n>", "Override solver timeout for each Run")
  .action(async (
    targetId: string | undefined,
    options: {
      agent: string
      environment?: string
      runs: string | number
      prompt?: string
      reset?: boolean
      prefix?: string
      concurrency?: string | number
      timeoutMinutes?: string | number
    },
  ) => {
    const runs = await Effect.runPromise(parseRunCount(options.runs))
    const timeoutMs = parseTimeoutMs(options.timeoutMinutes)
    const common = {
      agentId: options.agent,
      runs,
      ...(options.environment === undefined
        ? {}
        : { environmentId: options.environment }),
      ...(options.prompt === undefined ? {} : { prompt: options.prompt }),
      ...(timeoutMs === undefined ? {} : { timeoutMs }),
    }
    if (targetId === undefined) {
      const result = await runApplication(startAllBenchmarkTargets({
        ...common,
        reset: options.reset ?? false,
        ...(options.prefix === undefined ? {} : { prefix: options.prefix }),
        ...(options.concurrency === undefined
          ? {}
          : { concurrency: Number(options.concurrency) }),
      }, runsRoot))
      renderExperimentRun(result)
      return
    }

    const result = await runApplication(startBenchmarkTarget({ ...common, targetId }, runsRoot))
    console.log(JSON.stringify(result, null, 2))
  })

cli
  .command(
    "resume-cumulative <targetId> <sequenceRunId>",
    "Resume an existing cumulative Run from a stage.",
  )
  .option("--from <stageKey>", "Stage key to resume from")
  .option("--agent <agentId>", "Agent override; defaults to sequence-run.json")
  .option("--environment <environmentId>", "Execution Environment")
  .option("--prompt <prompt>", "Custom prompt override")
  .option("--timeout-minutes <n>", "Override solver timeout for each resumed stage")
  .action(async (
    targetId: string,
    sequenceRunId: string,
    options: {
      from?: string
      agent?: string
      environment?: string
      prompt?: string
      timeoutMinutes?: string | number
    },
  ) => {
    if (options.from === undefined) {
      console.error("Missing required option: --from <stageKey>")
      process.exitCode = 1
      return
    }
    const timeoutMs = parseTimeoutMs(options.timeoutMinutes)
    console.log(JSON.stringify(
      await runApplication(resumeCumulativeTargetRun({
        targetId,
        sequenceRunId,
        fromStageKey: options.from,
        ...(options.agent === undefined ? {} : { agentId: options.agent }),
        ...(options.environment === undefined
          ? {}
          : { environmentId: options.environment }),
        ...(options.prompt === undefined ? {} : { prompt: options.prompt }),
        ...(timeoutMs === undefined ? {} : { timeoutMs }),
      }, runsRoot)),
      null,
      2,
    ))
  })

cli
  .command("experiment <action> [agent]", "Run, judge, or inspect an experiment")
  .option("--prefix <prefix>", "Filter targets by Target Catalog prefix")
  .option("--concurrency <n>", "Number of targets or Runs to process concurrently")
  .option("--runs <n>", "Number of independent Runs", { default: "1" })
  .option("--reset", "Reset Progress before batch execution")
  .option("--timeout-minutes <n>", "Override solver timeout for each Run")
  .option("--judge <agent>", "Judge agent or alias", { default: DEFAULT_JUDGE_AGENT_ID })
  .option("--force", "Allow another AI Review from the same judge")
  .action(async (
    action: string,
    agent: string | undefined,
    options: {
      prefix?: string
      concurrency?: string | number
      runs: string | number
      reset?: boolean
      timeoutMinutes?: string | number
      judge: string
      force?: boolean
    },
  ) => {
    if (action === "run") {
      if (agent === undefined) {
        console.error("Missing required argument: agent")
        process.exitCode = 1
        return
      }
      const runs = await Effect.runPromise(parseRunCount(options.runs))
      const timeoutMs = parseTimeoutMs(options.timeoutMinutes)
      renderExperimentRun(
        await runApplication(runExperiment(agent, {
          runs,
          reset: options.reset ?? false,
          ...(options.prefix === undefined ? {} : { prefix: options.prefix }),
          ...(options.concurrency === undefined
            ? {}
            : { concurrency: options.concurrency }),
          ...(timeoutMs === undefined ? {} : { timeoutMs }),
        }, runsRoot)),
      )
      return
    }

    if (action === "judge") {
      if (agent === undefined) {
        console.error("Missing required argument: agent")
        process.exitCode = 1
        return
      }
      renderExperimentJudge(await runApplication(judgeExperiment(agent, {
        judgeAliasOrId: options.judge,
        force: options.force ?? false,
        ...(options.prefix === undefined ? {} : { prefix: options.prefix }),
        ...(options.concurrency === undefined
          ? {}
          : { concurrency: options.concurrency }),
      }, runsRoot)))
      return
    }

    if (action === "status") {
      const statusOptions = options.prefix === undefined
        ? {}
        : { prefix: options.prefix }
      if (agent !== undefined) {
        renderExperimentStatus(
          await runApplication(getExperimentStatus(agent, statusOptions, runsRoot)),
        )
        return
      }

      const agents = await runApplication(listAgents())
      const configuredAgents = agents.map((item) => item.agentId)
      for (const [index, agentId] of configuredAgents.entries()) {
        renderExperimentStatus(
          await runApplication(getExperimentStatus(agentId, statusOptions, runsRoot)),
        )
        if (index < configuredAgents.length - 1) console.log("")
      }
      return
    }

    console.error(`Unknown experiment action: ${action}`)
    console.error("Expected one of: run, judge, status")
    process.exitCode = 1
  })

cli.command("list-targets", "List Benchmark Targets").action(async () => {
  renderTargets(await runApplication(listBenchmarkTargets()))
})

cli.command("list-agents", "List configured agents").action(async () => {
  renderAgents(await runApplication(listAgents()))
})

cli.command("list-environments", "List Execution Environments").action(async () => {
  renderEnvironments(await runApplication(listExecutionEnvironments()))
})

cli
  .command("list-runs", "List Runs")
  .option("--task <taskId>", "Filter by Task ID")
  .action(async (options: { task?: string }) => {
    renderRuns(await runApplication(listRuns(runsRoot, options.task)))
  })

cli
  .command("inspect-run <runId>", "Inspect a Run")
  .option("--task <taskId>", "Task ID used to locate the Run")
  .action(async (runId: string, options: { task?: string }) => {
    renderInspection(await runApplication(inspectRun(runId, runsRoot, options.task)))
  })

cli
  .command("review <runId>", "Initialize Manual Review")
  .option("--task <taskId>", "Task ID used to locate the Run")
  .action(async (runId: string, options: { task?: string }) => {
    const reviewPath = await runApplication(
      createManualReview(runId, runsRoot, options.task),
    )
    console.log(`Review directory: ${reviewPath}`)
    console.log(`  review.md:  ${reviewPath}/review.md`)
    console.log(`  score.json: ${reviewPath}/score.json`)
  })

cli
  .command("rubric-generate <taskId>", "Generate a Rubric Draft")
  .option("--agent <agentId>", "Agent to use", {
    default: DEFAULT_RUBRIC_AGENT_ID,
  })
  .action(async (taskId: string, options: { agent: string }) => {
    console.log(JSON.stringify(
      await runApplication(generateRubricDraft(taskId, options.agent)),
      null,
      2,
    ))
  })

cli
  .command("rubric-approve <taskId>", "Approve a reviewed Rubric Draft")
  .option("--force", "Replace an existing Approved Rubric")
  .action(async (taskId: string, options: { force?: boolean }) => {
    console.log(JSON.stringify(
      await runApplication(approveRubricDraft(taskId, options.force ?? false)),
      null,
      2,
    ))
  })

cli
  .command("judge <runId>", "Evaluate a Run with AI Judge")
  .option("--task <taskId>", "Task ID used to locate the Run")
  .option("--agent <agentId>", "AI Judge agent", {
    default: DEFAULT_JUDGE_AGENT_ID,
  })
  .option("--force", "Allow another AI Review from the same agent")
  .action(async (
    runId: string,
    options: { task?: string; agent: string; force?: boolean },
  ) => {
    console.log(JSON.stringify(
      await runApplication(judgeLocatedRun(
        runId,
        runsRoot,
        options.agent,
        options.force ?? false,
        options.task,
      )),
      null,
      2,
    ))
  })

cli.command("doctor", "Check system requirements").action(async () => {
  const result = await runApplication(runDoctor())
  renderDoctor(result.hostChecks, result.agentAvailabilities)
})

cli
  .command("docker-build", "Build Docker images")
  .option("--agent <agentId>", "Build a specific agent image")
  .option("--environment <environmentId>", "Build an Environment image")
  .action(async (options: { agent?: string; environment?: string }) => {
    const results = await runApplication(buildDockerImages({
      ...(options.agent === undefined ? {} : { agentId: options.agent }),
      ...(options.environment === undefined
        ? {}
        : { environmentId: options.environment }),
    }))
    for (const result of results) console.log(`  ${result}`)
  })

cli.command("progress", "Show Benchmark Target Progress").action(async () => {
  renderProgress(await runApplication(getProgress()))
})

cli
  .command("session <runId>", "Rebuild Session from existing Run Evidence")
  .option("--task <taskId>", "Task ID used to locate the Run")
  .action(async (runId: string, options: { task?: string }) => {
    try {
      renderSessionRebuild(
        await runApplication(rebuildSession(runId, runsRoot, options.task)),
      )
    } catch (error) {
      if (error instanceof SessionRawUnavailableError) {
        renderSessionRawUnavailable(error)
        process.exitCode = 1
        return
      }
      throw error
    }
  })

cli.command("tui", "Launch terminal UI").action(async () => {
  const { renderTui } = await import("../tui/App.js")
  await renderTui()
})

cli.help()
cli.parse()

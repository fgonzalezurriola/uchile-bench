import { Clock, DateTime, Effect } from "effect"
import path from "node:path"
import { JUDGE_PURPOSE } from "../adapters/AgentAdapter.js"
import { TransientSessionFile } from "../domain/Evidence.js"
import {
  AgentInvocationError,
  JudgeVerdictValidationError,
} from "../domain/Errors.js"
import {
  decodeJudgeVerdict,
  validateJudgeVerdict,
} from "../domain/JudgeVerdict.js"
import { sessionTerminalError } from "../domain/Session.js"
import { judgePrompt } from "../prompts/judgePrompt.js"
import { AgentInvocationService } from "../services/AgentInvocationService.js"
import { BenchmarkCatalogService } from "../services/BenchmarkCatalogService.js"
import { FileSystemService } from "../services/FileSystemService.js"
import { HashService } from "../services/HashService.js"
import { RubricService } from "../services/RubricService.js"
import { RunStoreService } from "../services/RunStoreService.js"
import { SessionService } from "../services/SessionService.js"
import { renderJudgeReview } from "./renderJudgeReview.js"

const currentIso = Effect.fnUntraced(function*() {
  const now = yield* Clock.currentTimeMillis
  return DateTime.formatIso(DateTime.makeUnsafe(now))
})

const makeId = Effect.fnUntraced(function*() {
  return (yield* currentIso()).replaceAll(":", "-").replaceAll(".", "-")
})

const judgeRunStatus = (value: unknown): string | null => {
  if (typeof value !== "object" || value === null || !("status" in value)) {
    return null
  }
  const status = (value as { readonly status?: unknown }).status
  return typeof status === "string" ? status : null
}

export interface JudgeRunOptions {
  readonly runDir: string
  readonly agentId: string
  readonly force?: boolean
}

export const judgeRun = Effect.fnUntraced(function*(options: JudgeRunOptions) {
  const fs = yield* FileSystemService
  const hash = yield* HashService
  const rubrics = yield* RubricService
  const runStore = yield* RunStoreService
  const catalog = yield* BenchmarkCatalogService
  const invocation = yield* AgentInvocationService
  const sessions = yield* SessionService
  const run = yield* runStore.loadRun(options.runDir)
  if (run.status !== "completed") {
    return yield* Effect.fail(
      new JudgeVerdictValidationError({
        path: options.runDir,
        reason: `Only completed runs can be judged; status is ${run.status}`,
      }),
    )
  }

  const task = yield* catalog.getTask(run.taskId)
  const approvedRubric = yield* rubrics.getApproved(task).pipe(
    Effect.mapError(
      (cause) =>
        new JudgeVerdictValidationError({
          path: cause.path,
          reason: cause.reason,
          cause,
        }),
    ),
  )
  const rubricHash = approvedRubric.hash
  const submissionHash = yield* hash.hashDirectory(run.paths.output)

  const agentRoot = path.join(run.paths.review, "ai", options.agentId)
  const previous = yield* fs.listDir(agentRoot)
  let completedReviewExists = false
  for (const reviewId of previous) {
    const metadata = yield* fs
      .readJson<unknown>(path.join(agentRoot, reviewId, "judge-run.json"))
      .pipe(Effect.catch(() => Effect.succeed(null)))
    if (judgeRunStatus(metadata) === "completed") {
      completedReviewExists = true
      break
    }
  }
  if (completedReviewExists && options.force !== true) {
    return yield* Effect.fail(
      new JudgeVerdictValidationError({
        path: agentRoot,
        reason: "This agent already has an AI review; pass --force to run another",
      }),
    )
  }

  const judgeId = `${yield* makeId()}_${options.agentId}`
  const root = path.join(agentRoot, judgeId)
  const generatedPath = path.join(root, "generated")
  const workspacePath = path.join(root, "workspace")
  const homePath = path.join(root, "agent-home")
  const configPath = path.join(root, "agent-config")
  const prompt = judgePrompt(task, run.runId, rubricHash)
  const startedAt = yield* currentIso()
  const failJudge = Effect.fnUntraced(function*(error: string) {
    const finishedAt = yield* currentIso()
    yield* fs.writeJson(path.join(root, "judge-run.json"), {
      version: 1,
      judgeId,
      runId: run.runId,
      taskId: task.id,
      agentId: options.agentId,
      status: "failed",
      startedAt,
      finishedAt,
      rubricHash,
      submissionHash,
      error,
    })
    return yield* Effect.fail(
      new AgentInvocationError({ agentId: options.agentId, reason: error }),
    )
  })

  yield* fs.mkdirRecursive(generatedPath)
  yield* fs.copyDir(run.paths.output, workspacePath)
  yield* fs.writeFile(path.join(root, "prompt.txt"), prompt)
  yield* rubrics.snapshotApproved(task, path.join(root, "rubric.snapshot.md")).pipe(
    Effect.mapError(
      (cause) =>
        new JudgeVerdictValidationError({
          path: cause.path,
          reason: cause.reason,
          cause,
        }),
    ),
  )
  yield* fs.writeJson(path.join(root, "judge-run.json"), {
    version: 1,
    judgeId,
    runId: run.runId,
    taskId: task.id,
    agentId: options.agentId,
    status: "running",
    startedAt,
    finishedAt: null,
    rubricHash,
    submissionHash,
  })

  const transientSessionDir = path.join(root, TransientSessionFile.DIRECTORY)
  const transientEventsPath = path.join(
    transientSessionDir,
    TransientSessionFile.EVENTS_JSONL,
  )
  const result = yield* invocation.invoke({
    agent: {
      _tag: "CatalogAgent",
      agentId: options.agentId,
      ...(task.environmentId === undefined
        ? {}
        : { taskEnvironmentId: task.environmentId }),
    },
    prompt,
    mounts: [
      {
        hostPath: run.paths.input,
        containerPath: "/baseline",
        readOnly: true,
      },
      {
        hostPath: run.paths.output,
        containerPath: "/submission",
        readOnly: true,
      },
      {
        hostPath: workspacePath,
        containerPath: "/workspace",
      },
      {
        hostPath: task.publicAbsPath,
        containerPath: "/assignment",
        readOnly: true,
      },
      {
        hostPath: task.gradingAbsPath,
        containerPath: "/grading",
        readOnly: true,
      },
      {
        hostPath: run.paths.evidence,
        containerPath: "/evidence",
        readOnly: true,
      },
      {
        hostPath: generatedPath,
        containerPath: "/judge-output",
      },
    ],
    workDir: "/workspace",
    agentHomePath: homePath,
    agentConfigPath: configPath,
    capture: {
      eventsPath: transientEventsPath,
      stderrPath: path.join(root, "stderr.log"),
    },
    container: {
      timeoutMs: Math.min(task.maxMinutes, 60) * 60 * 1000,
    },
    runtime: {
      purpose: JUDGE_PURPOSE,
      tools: ["read", "bash", "write"],
    },
  })

  const invocationFinishedAt = yield* currentIso()
  const publishedSession = yield* sessions.createAndSaveFromFile(
    {
      adapter: result.adapter,
      model: result.model,
      runId: judgeId,
      taskId: task.id,
      agentId: options.agentId,
      startedAt,
      finishedAt: invocationFinishedAt,
      prompt,
      eventSource: "Pi --mode json (transient)",
    },
    transientEventsPath,
    path.join(root, "07-session"),
  ).pipe(
    Effect.tapError((error) =>
      Effect.gen(function*() {
        const errorMessage = error instanceof Error ? error.message : String(error)
        yield* fs.writeJson(
          path.join(transientSessionDir, TransientSessionFile.COMPACTION_ERROR),
          {
            version: 1,
            sourcePath: transientEventsPath,
            sessionPath: path.join(root, "07-session"),
            error: errorMessage,
          },
        ).pipe(Effect.ignore)
        yield* fs.writeJson(path.join(root, "judge-run.json"), {
          version: 1,
          judgeId,
          runId: run.runId,
          taskId: task.id,
          agentId: options.agentId,
          model: result.model,
          image: result.image,
          status: "failed",
          startedAt,
          finishedAt: invocationFinishedAt,
          rubricHash,
          submissionHash,
          error: `Session compaction failed: ${errorMessage}`,
        }).pipe(Effect.ignore)
      }),
    ),
  )
  yield* fs.removePath(transientSessionDir)
  yield* fs.removePath(homePath)
  const sessionFailureReason = sessionTerminalError(publishedSession.session)
  if (result.timedOut || result.exitCode !== 0) {
    const finishedAt = invocationFinishedAt
    yield* fs.writeJson(path.join(root, "judge-run.json"), {
      version: 1,
      judgeId,
      runId: run.runId,
      taskId: task.id,
      agentId: options.agentId,
      model: result.model,
      image: result.image,
      status: "failed",
      startedAt,
      finishedAt,
      rubricHash,
      submissionHash,
      error: result.timedOut
        ? "Judge timed out"
        : `Judge exited with code ${result.exitCode}`,
    })
    return yield* Effect.fail(
      new AgentInvocationError({
        agentId: options.agentId,
        reason: result.timedOut
          ? "Judge timed out"
          : `Judge exited with code ${result.exitCode}: ${result.stderr.slice(0, 500)}`,
      }),
    )
  }
  if (sessionFailureReason !== null) {
    return yield* failJudge(`Judge session failed: ${sessionFailureReason}`)
  }

  const generatedVerdictPath = path.join(generatedPath, "verdict.json")
  const rawVerdict = yield* fs.readJson<unknown>(generatedVerdictPath).pipe(
    Effect.catch((error) =>
      failJudge(`Judge did not write verdict.json: ${error.message}`)
    ),
  )
  yield* fs.writeJson(path.join(root, "verdict.raw.json"), rawVerdict)
  const decodedVerdict = yield* decodeJudgeVerdict(
    rawVerdict,
    generatedVerdictPath,
  )
  const verdict = yield* validateJudgeVerdict(
    decodedVerdict,
    {
      taskId: task.id,
      runId: run.runId,
      rubricHash,
    },
    generatedVerdictPath,
  )

  yield* fs.writeJson(path.join(root, "verdict.json"), verdict)
  yield* fs.writeFile(
    path.join(root, "review.md"),
    renderJudgeReview(verdict),
  )
  const finishedAt = yield* currentIso()
  yield* fs.writeJson(path.join(root, "judge-run.json"), {
    version: 1,
    judgeId,
    runId: run.runId,
    taskId: task.id,
    agentId: options.agentId,
    model: result.model,
    image: result.image,
    status: "completed",
    startedAt,
    finishedAt,
    rubricHash,
    submissionHash,
    rawPoints: verdict.rawPoints,
    rawMaximumPoints: verdict.rawMaximumPoints,
    weightedCompletion: verdict.weightedCompletion,
    grade: verdict.grade,
    confidence: verdict.confidence,
  })

  return {
    judgeId,
    reviewPath: root,
    verdict,
  }
})

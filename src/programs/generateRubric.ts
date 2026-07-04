import { Clock, DateTime, Effect } from "effect"
import path from "node:path"
import { RUBRIC_GENERATOR_PURPOSE } from "../adapters/AgentAdapter.js"
import { TransientSessionFile } from "../domain/Evidence.js"
import {
  AgentInvocationError,
  RubricValidationError,
} from "../domain/Errors.js"
import type { AgentSession } from "../domain/Session.js"
import { rubricGenerationPrompt } from "../prompts/rubricGenerationPrompt.js"
import { AgentInvocationService } from "../services/AgentInvocationService.js"
import { BenchmarkCatalogService } from "../services/BenchmarkCatalogService.js"
import { FileSystemService } from "../services/FileSystemService.js"
import { RubricService } from "../services/RubricService.js"
import { SessionService } from "../services/SessionService.js"

const textExtensions = new Set([
  ".c",
  ".cc",
  ".cpp",
  ".css",
  ".glsl",
  ".h",
  ".hpp",
  ".html",
  ".java",
  ".js",
  ".json",
  ".md",
  ".py",
  ".rkt",
  ".sh",
  ".toml",
  ".ts",
  ".txt",
  ".yaml",
  ".yml",
])

const currentIso = Effect.fnUntraced(function*() {
  const now = yield* Clock.currentTimeMillis
  return DateTime.formatIso(DateTime.makeUnsafe(now))
})

const makeId = Effect.fnUntraced(function*() {
  return (yield* currentIso()).replaceAll(":", "-").replaceAll(".", "-")
})

const finalAssistantText = (session: AgentSession): string | null => {
  for (let index = session.turns.length - 1; index >= 0; index -= 1) {
    const turn = session.turns[index]
    if (turn?.role !== "assistant") continue
    const text = (turn.content ?? [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim()
    if (text.length > 0) return text
  }
  return null
}

export const generateRubric = Effect.fnUntraced(function*(
  taskId: string,
  agentId: string,
) {
  const catalog = yield* BenchmarkCatalogService
  const fs = yield* FileSystemService
  const rubrics = yield* RubricService
  const invocation = yield* AgentInvocationService
  const sessions = yield* SessionService
  const task = yield* catalog.getTask(taskId)
  const generationId = `${yield* makeId()}_${agentId}`
  const root = path.resolve("runs", "rubrics", task.id, generationId)
  const outputPath = path.join(root, "output")
  const homePath = path.join(root, "agent-home")
  const configPath = path.join(root, "agent-config")
  const transientSessionDir = path.join(root, TransientSessionFile.DIRECTORY)
  const transientEventsPath = path.join(
    transientSessionDir,
    TransientSessionFile.EVENTS_JSONL,
  )
  const sessionPath = path.join(root, "07-session")

  const contextParts: string[] = []
  const contextRoots = [
    { label: "MATERIAL PÚBLICO", root: task.publicAbsPath, grading: false },
    {
      label: "MATERIAL DE EVALUACIÓN",
      root: task.gradingAbsPath,
      grading: true,
    },
  ] as const
  for (const source of contextRoots) {
    const files = [...(yield* fs.walkDir(source.root))].sort()
    for (const file of files) {
      const relativePath = path.relative(source.root, file)
      if (source.grading && rubrics.isManagedArtifact(relativePath)) continue
      if (!textExtensions.has(path.extname(file).toLowerCase())) continue
      const content = yield* fs.readFile(file)
      contextParts.push(
        `--- ${source.label}: ${relativePath} ---\n${content.trim()}\n`,
      )
    }
  }
  if (contextParts.length === 0) {
    return yield* Effect.fail(
      new RubricValidationError({
        path: task.publicAbsPath,
        reason: "No textual task material was found",
      }),
    )
  }

  const prompt = rubricGenerationPrompt(task, contextParts.join("\n"))
  yield* fs.mkdirRecursive(outputPath)
  yield* fs.writeFile(path.join(root, "prompt.txt"), prompt)

  const startedAt = yield* currentIso()
  const result = yield* invocation.invoke({
    agent: {
      _tag: "CatalogAgent",
      agentId,
    },
    prompt,
    mounts: [],
    workDir: "/tmp",
    agentHomePath: homePath,
    agentConfigPath: configPath,
    capture: {
      eventsPath: transientEventsPath,
      stderrPath: path.join(root, "stderr.log"),
    },
    container: {
      timeoutMs: Math.min(task.maxMinutes, 20) * 60 * 1000,
    },
    runtime: {
      purpose: RUBRIC_GENERATOR_PURPOSE,
      thinking: "high",
      disableTools: true,
      outputMode: "json",
    },
  })

  const finishedAt = yield* currentIso()
  const publishedSession = yield* sessions.createAndSaveFromFile(
    {
      adapter: result.adapter,
      model: result.model,
      runId: generationId,
      taskId: task.id,
      agentId,
      startedAt,
      finishedAt,
      prompt,
      eventSource: "Pi --mode json (transient)",
    },
    transientEventsPath,
    sessionPath,
  ).pipe(
    Effect.tapError((error) =>
      fs.writeJson(
        path.join(transientSessionDir, TransientSessionFile.COMPACTION_ERROR),
        {
          version: 1,
          sourcePath: transientEventsPath,
          sessionPath,
          error: error instanceof Error ? error.message : String(error),
        },
      ).pipe(Effect.ignore),
    ),
  )
  yield* fs.removePath(transientSessionDir)
  yield* fs.removePath(homePath)
  if (result.timedOut || result.exitCode !== 0) {
    return yield* Effect.fail(
      new AgentInvocationError({
        agentId,
        reason: result.timedOut
          ? "Rubric generation timed out"
          : `Rubric generator exited with code ${result.exitCode}: ${result.stderr.slice(0, 500)}`,
      }),
    )
  }

  const response = finalAssistantText(publishedSession.session)
  if (response === null) {
    return yield* Effect.fail(new AgentInvocationError({
      agentId,
      reason: "Rubric generator completed without assistant text",
    }))
  }
  const responsePath = path.join(outputPath, "rubric.response.md")
  yield* fs.writeFile(responsePath, `${response}\n`)

  const draft = yield* rubrics.saveDraft(
    task,
    response,
    responsePath,
    {
      generationId,
      agentId,
      model: result.model,
      image: result.image,
      sourceRunPath: root,
    },
  )

  return {
    taskId: task.id,
    draftPath: draft.draftPath,
    metadataPath: draft.metadataPath,
    generationPath: root,
    draftHash: draft.draftHash,
  }
})

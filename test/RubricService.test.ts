import { describe, test } from "bun:test"
import assert from "node:assert/strict"
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import os from "node:os"
import path from "node:path"
import { Effect, Layer, Schema } from "effect"
import { TaskIdSchema, type ResolvedTask } from "../src/domain/Task.js"
import { FileSystemServiceLive } from "../src/services/FileSystemService.js"
import { HashServiceLive } from "../src/services/HashService.js"
import {
  RubricService,
  RubricServiceLive,
} from "../src/services/RubricService.js"

const validRubric = `# Pauta de evaluación

<!-- benchmark-task-id: course/task -->

## Alcance
Evalúa solamente la tarea actual.

## Criterios

### P1 — Implementación
- Puntaje máximo: 4.0

## Descuentos, topes y reglas especiales — si corresponde
No corresponde.

## Escala final
- Nota mínima: 1.0
- Nota máxima: 7.0
- Redondeo: un decimal

## Supuestos y decisiones para revisión humana
No hay supuestos.
`

const makeTask = (root: string): ResolvedTask => {
  const taskDir = path.join(root, "task")
  const gradingAbsPath = path.join(taskDir, "grading")
  mkdirSync(gradingAbsPath, { recursive: true })
  return {
    id: Schema.decodeUnknownSync(TaskIdSchema)("course/task"),
    source: { _tag: "Standalone" },
    title: "Task",
    description: "Task",
    evaluation: "manual",
    notes: { languageSpecified: true, starterProvided: true },
    publicDir: "public",
    originalDir: "original",
    gradingDir: "grading",
    maxMinutes: 30,
    taskDir,
    publicAbsPath: path.join(taskDir, "public"),
    originalAbsPath: path.join(taskDir, "original"),
    gradingAbsPath,
  }
}

const layer = RubricServiceLive.pipe(
  Layer.provide(Layer.merge(FileSystemServiceLive, HashServiceLive)),
)

const run = <A, E>(effect: Effect.Effect<A, E, RubricService>) =>
  Effect.runPromise(effect.pipe(Effect.provide(layer)))

const withHarness = async (
  body: (root: string, task: ResolvedTask) => Promise<void>,
) => {
  const root = mkdtempSync(path.join(os.tmpdir(), "rubric-service-"))
  try {
    await body(root, makeTask(root))
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

const saveDraft = (task: ResolvedTask, content = validRubric) =>
  Effect.gen(function*() {
    const rubrics = yield* RubricService
    return yield* rubrics.saveDraft(task, content, "response.md", {
      generationId: "generation-1",
      agentId: "judge-agent",
      model: "model",
      image: "image",
      sourceRunPath: "/runs/rubrics/generation-1",
    })
  })

const approve = (task: ResolvedTask, force = false) =>
  Effect.gen(function*() {
    const rubrics = yield* RubricService
    return yield* rubrics.approveDraft(task, force)
  })

const getApproved = (task: ResolvedTask) =>
  Effect.gen(function*() {
    const rubrics = yield* RubricService
    return yield* rubrics.getApproved(task)
  })

describe("RubricService", () => {
  test("stores a valid Rubric Draft and rejects an invalid one", async () => {
    await withHarness(async (_root, task) => {
      const draft = await run(saveDraft(task))
      assert.equal(readFileSync(draft.draftPath, "utf8"), validRubric)
      assert.match(draft.draftHash, /^[a-f0-9]{64}$/)

      await assert.rejects(
        run(saveDraft(task, "# Pauta de evaluación\n")),
        /Missing required rubric section/,
      )
    })
  })

  test("approves once and requires force for replacement", async () => {
    await withHarness(async (_root, task) => {
      await run(saveDraft(task))
      const first = await run(approve(task))
      const verified = await run(getApproved(task))
      assert.equal(verified.hash, first.rubricHash)
      assert.equal(verified.approval.taskId, task.id)
      assert.equal(verified.approval.draftHash !== undefined, true)

      await assert.rejects(run(approve(task)), /--force/)
      const replacement = await run(approve(task, true))
      assert.equal(replacement.rubricHash, first.rubricHash)
    })
  })

  test("rejects missing, malformed, wrong-Task, and incompatible approval metadata", async () => {
    await withHarness(async (_root, task) => {
      await run(saveDraft(task))
      await run(approve(task))
      const approvalPath = path.join(task.gradingAbsPath, "rubric.approval.json")

      rmSync(approvalPath)
      await assert.rejects(run(getApproved(task)), /Rubric Approval is required/)

      writeFileSync(approvalPath, "{not-json")
      await assert.rejects(run(getApproved(task)), /Malformed Rubric Approval/)

      writeFileSync(approvalPath, JSON.stringify({
        version: 2,
        taskId: "other/task",
        rubricHash: "hash",
        approvedAt: "2026-06-27T00:00:00.000Z",
        sourceDraftPath: "draft",
      }))
      await assert.rejects(run(getApproved(task)), /belongs to Task other\/task/)

      writeFileSync(approvalPath, JSON.stringify({
        version: 1,
        taskId: task.id,
        rubricHash: "hash",
        approvedAt: "2026-06-27T00:00:00.000Z",
        sourceDraftPath: "draft",
      }))
      await assert.rejects(run(getApproved(task)), /Malformed Rubric Approval/)
    })
  })

  test("rejects a stale Rubric Draft hash and malformed generation metadata", async () => {
    await withHarness(async (_root, task) => {
      const draft = await run(saveDraft(task))
      writeFileSync(draft.draftPath, `${validRubric}\nEdited after generation.\n`)
      await assert.rejects(run(approve(task)), /hash is stale/)

      writeFileSync(
        path.join(task.gradingAbsPath, "rubric-generation.json"),
        JSON.stringify({ version: 9 }),
      )
      await assert.rejects(run(approve(task)), /Malformed Rubric Draft metadata/)
    })
  })

  test("rejects an Approved Rubric modified after approval", async () => {
    await withHarness(async (_root, task) => {
      await run(saveDraft(task))
      const approved = await run(approve(task))
      writeFileSync(approved.approvedPath, `${validRubric}\nModified.\n`)
      await assert.rejects(run(getApproved(task)), /modified after approval/)
    })
  })

  test("returns and snapshots only a verified Approved Rubric with its hash", async () => {
    await withHarness(async (root, task) => {
      await run(saveDraft(task))
      await run(approve(task))
      const destination = path.join(root, "judge", "rubric.snapshot.md")
      const verified = await run(
        Effect.gen(function*() {
          const rubrics = yield* RubricService
          return yield* rubrics.snapshotApproved(task, destination)
        }),
      )
      assert.equal(readFileSync(destination, "utf8"), verified.content)
      assert.match(verified.hash, /^[a-f0-9]{64}$/)
      assert.equal(verified.approval.rubricHash, verified.hash)
    })
  })
})

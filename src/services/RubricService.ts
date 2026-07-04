import { Clock, Context, DateTime, Effect, Layer, Schema } from "effect"
import path from "node:path"
import { RubricValidationError } from "../domain/Errors.js"
import { validateRubricForTask } from "../domain/Rubric.js"
import type { ResolvedTask } from "../domain/Task.js"
import {
  RubricApprovalJsonSchema,
  RubricGenerationJsonSchema,
  type RubricApprovalJson,
  type RubricGenerationJson,
} from "../schemas/RubricApprovalJson.js"
import { FileSystemService } from "./FileSystemService.js"
import { HashService } from "./HashService.js"

export interface RubricPaths {
  readonly draft: string
  readonly approved: string
  readonly approval: string
  readonly generation: string
}

export interface SaveRubricDraftOptions {
  readonly generationId: string
  readonly agentId: string
  readonly model: string
  readonly image: string
  readonly sourceRunPath: string
}

export interface VerifiedApprovedRubric {
  readonly taskId: string
  readonly content: string
  readonly hash: string
  readonly path: string
  readonly approvalPath: string
  readonly approval: RubricApprovalJson
}

export interface RubricService {
  readonly isManagedArtifact: (relativePath: string) => boolean
  readonly pathsFor: (task: ResolvedTask) => RubricPaths
  readonly saveDraft: (
    task: ResolvedTask,
    content: string,
    sourcePath: string,
    options: SaveRubricDraftOptions,
  ) => Effect.Effect<{
    readonly draftPath: string
    readonly metadataPath: string
    readonly draftHash: string
  }, RubricValidationError>
  readonly approveDraft: (
    task: ResolvedTask,
    force?: boolean,
  ) => Effect.Effect<{
    readonly approvedPath: string
    readonly approvalPath: string
    readonly rubricHash: string
  }, RubricValidationError>
  readonly getApproved: (
    task: ResolvedTask,
  ) => Effect.Effect<VerifiedApprovedRubric, RubricValidationError>
  readonly snapshotApproved: (
    task: ResolvedTask,
    destination: string,
  ) => Effect.Effect<VerifiedApprovedRubric, RubricValidationError>
}

export const RubricService = Context.Service<RubricService>("RubricService")

const fail = (filePath: string, reason: string, cause?: unknown) =>
  Effect.fail(new RubricValidationError({ path: filePath, reason, cause }))

const decodeApproval = (
  content: string,
  approvalPath: string,
): Effect.Effect<RubricApprovalJson, RubricValidationError> =>
  Schema.decodeUnknownEffect(Schema.fromJsonString(RubricApprovalJsonSchema))(
    content,
  ).pipe(
    Effect.mapError((cause) =>
      new RubricValidationError({
        path: approvalPath,
        reason: `Malformed Rubric Approval: ${String(cause)}`,
        cause,
      })
    ),
  )

const decodeGeneration = (
  content: string,
  generationPath: string,
): Effect.Effect<RubricGenerationJson, RubricValidationError> =>
  Schema.decodeUnknownEffect(Schema.fromJsonString(RubricGenerationJsonSchema))(
    content,
  ).pipe(
    Effect.mapError((cause) =>
      new RubricValidationError({
        path: generationPath,
        reason: `Malformed Rubric Draft metadata: ${String(cause)}`,
        cause,
      })
    ),
  )

const managedArtifactNames = new Set([
  "rubric.approval.json",
  "rubric.draft.json",
  "rubric.draft.md",
  "rubric-generation.json",
  "rubric.json",
  "rubric.md",
])

const currentIso = Effect.fnUntraced(function*() {
  const now = yield* Clock.currentTimeMillis
  return DateTime.formatIso(DateTime.makeUnsafe(now))
})

export const RubricServiceLive = Layer.effect(
  RubricService,
  Effect.gen(function*() {
    const fs = yield* FileSystemService
    const hash = yield* HashService

    const isManagedArtifact = (relativePath: string): boolean =>
      managedArtifactNames.has(relativePath)

    const pathsFor = (task: ResolvedTask): RubricPaths => ({
      draft: path.join(task.gradingAbsPath, "rubric.draft.md"),
      approved: path.join(task.gradingAbsPath, "rubric.md"),
      approval: path.join(task.gradingAbsPath, "rubric.approval.json"),
      generation: path.join(task.gradingAbsPath, "rubric-generation.json"),
    })

    const saveDraft = Effect.fnUntraced(function*(
      task: ResolvedTask,
      content: string,
      sourcePath: string,
      options: SaveRubricDraftOptions,
    ) {
      const paths = pathsFor(task)
      const rubric = yield* validateRubricForTask(content, task, sourcePath)
      yield* fs.writeFile(paths.draft, rubric).pipe(
        Effect.mapError((cause) =>
          new RubricValidationError({
            path: paths.draft,
            reason: cause.message,
            cause,
          })
        ),
      )
      const draftHash = yield* hash.hashFile(paths.draft)
      const metadata: RubricGenerationJson = {
        version: 2,
        taskId: task.id,
        generationId: options.generationId,
        agentId: options.agentId,
        model: options.model,
        image: options.image,
        draftHash,
        sourceRunPath: options.sourceRunPath,
      }
      yield* fs.writeJson(paths.generation, metadata).pipe(
        Effect.mapError((cause) =>
          new RubricValidationError({
            path: paths.generation,
            reason: cause.message,
            cause,
          })
        ),
      )
      return {
        draftPath: paths.draft,
        metadataPath: paths.generation,
        draftHash,
      }
    })

    const approveDraft = Effect.fnUntraced(function*(
      task: ResolvedTask,
      force = false,
    ) {
      const paths = pathsFor(task)
      const approvedExists = yield* fs.exists(paths.approved)
      const approvalExists = yield* fs.exists(paths.approval)
      if ((approvedExists || approvalExists) && !force) {
        return yield* fail(
          paths.approved,
          "An Approved Rubric already exists; pass --force to replace it",
        )
      }

      const draft = yield* fs.readFile(paths.draft).pipe(
        Effect.mapError((cause) =>
          new RubricValidationError({
            path: paths.draft,
            reason: cause.message,
            cause,
          })
        ),
      )
      const rubric = yield* validateRubricForTask(draft, task, paths.draft)
      const draftHash = yield* hash.hashFile(paths.draft)

      if (yield* fs.exists(paths.generation)) {
        const generationContent = yield* fs.readFile(paths.generation).pipe(
          Effect.mapError((cause) =>
            new RubricValidationError({
              path: paths.generation,
              reason: cause.message,
              cause,
            })
          ),
        )
        const generation = yield* decodeGeneration(
          generationContent,
          paths.generation,
        )
        if (generation.taskId !== task.id) {
          return yield* fail(
            paths.generation,
            `Rubric Draft metadata belongs to Task ${generation.taskId}, not ${task.id}`,
          )
        }
        if (generation.draftHash !== draftHash) {
          return yield* fail(
            paths.generation,
            "Rubric Draft hash is stale; regenerate metadata before approval",
          )
        }
      }

      yield* fs.writeFile(paths.approved, rubric).pipe(
        Effect.mapError((cause) =>
          new RubricValidationError({
            path: paths.approved,
            reason: cause.message,
            cause,
          })
        ),
      )
      const rubricHash = yield* hash.hashFile(paths.approved)
      const approval: RubricApprovalJson = {
        version: 2,
        taskId: task.id,
        rubricHash,
        draftHash,
        approvedAt: yield* currentIso(),
        sourceDraftPath: paths.draft,
      }
      yield* fs.writeJson(paths.approval, approval).pipe(
        Effect.mapError((cause) =>
          new RubricValidationError({
            path: paths.approval,
            reason: cause.message,
            cause,
          })
        ),
      )
      return {
        approvedPath: paths.approved,
        approvalPath: paths.approval,
        rubricHash,
      }
    })

    const getApproved = Effect.fnUntraced(function*(task: ResolvedTask) {
      const paths = pathsFor(task)
      if (!(yield* fs.exists(paths.approved))) {
        return yield* fail(paths.approved, "Approved Rubric is missing")
      }
      if (!(yield* fs.exists(paths.approval))) {
        return yield* fail(
          paths.approval,
          "Rubric Approval is required before AI Judge execution",
        )
      }

      const content = yield* fs.readFile(paths.approved).pipe(
        Effect.mapError((cause) =>
          new RubricValidationError({
            path: paths.approved,
            reason: cause.message,
            cause,
          })
        ),
      )
      const rubric = yield* validateRubricForTask(content, task, paths.approved)
      const rubricHash = yield* hash.hashFile(paths.approved)
      const approvalContent = yield* fs.readFile(paths.approval).pipe(
        Effect.mapError((cause) =>
          new RubricValidationError({
            path: paths.approval,
            reason: cause.message,
            cause,
          })
        ),
      )
      const approval = yield* decodeApproval(approvalContent, paths.approval)
      if (approval.taskId !== task.id) {
        return yield* fail(
          paths.approval,
          `Rubric Approval belongs to Task ${approval.taskId}, not ${task.id}`,
        )
      }
      if (approval.rubricHash !== rubricHash) {
        return yield* fail(
          paths.approval,
          "Approved Rubric was modified after approval",
        )
      }

      return {
        taskId: task.id,
        content: rubric,
        hash: rubricHash,
        path: paths.approved,
        approvalPath: paths.approval,
        approval,
      } satisfies VerifiedApprovedRubric
    })

    const snapshotApproved = Effect.fnUntraced(function*(
      task: ResolvedTask,
      destination: string,
    ) {
      const approved = yield* getApproved(task)
      yield* fs.writeFile(destination, approved.content).pipe(
        Effect.mapError((cause) =>
          new RubricValidationError({
            path: destination,
            reason: cause.message,
            cause,
          })
        ),
      )
      return approved
    })

    return {
      isManagedArtifact,
      pathsFor,
      saveDraft,
      approveDraft,
      getApproved,
      snapshotApproved,
    } satisfies RubricService
  }),
)

import { Schema } from "effect"

export const RubricApprovalJsonSchema = Schema.Struct({
  version: Schema.Literal(2),
  taskId: Schema.String,
  rubricHash: Schema.String,
  draftHash: Schema.optional(Schema.String),
  approvedAt: Schema.String,
  sourceDraftPath: Schema.String,
})

export const RubricGenerationJsonSchema = Schema.Struct({
  version: Schema.Literal(2),
  taskId: Schema.String,
  generationId: Schema.String,
  agentId: Schema.String,
  model: Schema.String,
  image: Schema.String,
  draftHash: Schema.String,
  sourceRunPath: Schema.String,
})

export type RubricApprovalJson = Schema.Schema.Type<typeof RubricApprovalJsonSchema>
export type RubricGenerationJson = Schema.Schema.Type<typeof RubricGenerationJsonSchema>

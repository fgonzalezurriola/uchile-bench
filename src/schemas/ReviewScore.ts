import { Schema } from "effect"

export const ReviewCategoriesSchema = Schema.Struct({
  requirements: Schema.NullOr(Schema.Number),
  correctness: Schema.NullOr(Schema.Number),
  completeness: Schema.NullOr(Schema.Number),
  executability: Schema.NullOr(Schema.Number),
  codeQuality: Schema.NullOr(Schema.Number),
  documentation: Schema.NullOr(Schema.Number),
})

export const ReviewScoreSchema = Schema.Struct({
  score: Schema.NullOr(Schema.Number),
  maxScore: Schema.Number,
  reviewer: Schema.NullOr(Schema.String),
  reviewedAt: Schema.NullOr(Schema.String),
  categories: ReviewCategoriesSchema,
  notes: Schema.String,
})

/** Canonical ReviewScore type — the schema is the single source of truth. */
export type ReviewScore = Schema.Schema.Type<typeof ReviewScoreSchema>

export type ReviewCategories = Schema.Schema.Type<typeof ReviewCategoriesSchema>

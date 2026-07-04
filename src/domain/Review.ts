/**
 * Review domain types.
 * Derives its shape from the schema (ReviewScore.ts).
 *
 * The schema is the single source of truth for the shape of a review.
 * This module re-exports canonical types and provides the factory function.
 */

import type { ReviewScore as SchemaReviewScore, ReviewCategories as SchemaReviewCategories } from "../schemas/ReviewScore.js"

// Re-export canonical types from schema
export type ReviewScore = SchemaReviewScore
export type ReviewCategories = SchemaReviewCategories

/** Factory: create an empty review score (all nulls, ready for human scoring). */
export const emptyReviewScore = (maxScore: number = 7): ReviewScore => ({
  score: null,
  maxScore,
  reviewer: null,
  reviewedAt: null,
  categories: {
    requirements: null,
    correctness: null,
    completeness: null,
    executability: null,
    codeQuality: null,
    documentation: null,
  },
  notes: "",
})

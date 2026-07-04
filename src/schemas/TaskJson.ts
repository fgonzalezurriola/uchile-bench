import { Schema } from "effect"

const NonEmptyString = Schema.String.check(Schema.isMinLength(1))

/** Metadata recorded for a benchmark task. */
export const TaskNotesSchema = Schema.Struct({
  languageSpecified: Schema.Boolean,
  starterProvided: Schema.Boolean,
})

/**
 * Manifest stored in each standalone task or cumulative-sequence stage.
 *
 * Identity is derived from the directory layout. The manifest contains only
 * metadata and optional directory overrides.
 */
export const TaskJsonSchema = Schema.Struct({
  title: NonEmptyString,
  description: NonEmptyString,
  publicDir: Schema.optional(NonEmptyString),
  originalDir: Schema.optional(NonEmptyString),
  gradingDir: Schema.optional(NonEmptyString),
  environmentId: Schema.optional(NonEmptyString),
  evaluation: Schema.Literals(["manual", "auto"]),
  maxMinutes: Schema.optional(Schema.Number.check(Schema.isGreaterThan(0))),
  notes: TaskNotesSchema,
})

/** Parsed task manifest. */
export type TaskManifest = Schema.Schema.Type<typeof TaskJsonSchema>

/** Parsed task notes. */
export type TaskNotes = Schema.Schema.Type<typeof TaskNotesSchema>

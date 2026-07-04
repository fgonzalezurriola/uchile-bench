import { Effect, Schema } from "effect"
import { BenchmarkConfigError } from "./Errors.js"

/** Positive integer number of independent executions requested for a target. */
export const RunCountSchema = Schema.Number.check(
  Schema.isInt(),
  Schema.isGreaterThan(0),
).pipe(Schema.brand("RunCount"))

/** CLI-compatible run count accepting either a parsed number or numeric string. */
export const RunCountInputSchema = Schema.Union([
  Schema.NumberFromString,
  Schema.Number,
])
  .check(Schema.isInt(), Schema.isGreaterThan(0))
  .pipe(Schema.brand("RunCount"))

/** Positive integer run count. */
export type RunCount = Schema.Schema.Type<typeof RunCountSchema>

/** Parse an unknown value into a positive integer run count. */
export const parseRunCount = (
  input: unknown,
): Effect.Effect<RunCount, BenchmarkConfigError> =>
  Schema.decodeUnknownEffect(RunCountInputSchema)(input).pipe(
    Effect.mapError(
      () =>
        new BenchmarkConfigError({
          reason: `runs must be a positive integer, got ${String(input)}`,
        }),
    ),
  )

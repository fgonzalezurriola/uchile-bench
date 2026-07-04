import { Schema } from "effect"

const NonEmptyString = Schema.String.check(Schema.isMinLength(1))

export const EnvironmentVariableSchema = Schema.Struct({
  key: NonEmptyString,
  value: Schema.String,
})

export const EnvironmentRuntimeSchema = Schema.Struct({
  cpuLimit: Schema.optional(NonEmptyString),
  memoryLimit: Schema.optional(NonEmptyString),
  pidsLimit: Schema.optional(
    Schema.Number.check(Schema.isGreaterThan(0)),
  ),
  networkMode: Schema.optional(
    Schema.Literals(["none", "bridge", "host"]),
  ),
  environmentVariables: Schema.optional(
    Schema.Array(EnvironmentVariableSchema),
  ),
  extraDockerArgs: Schema.optional(Schema.Array(NonEmptyString)),
})

export const EnvironmentConfigSchema = Schema.Struct({
  id: NonEmptyString,
  dockerImage: NonEmptyString,
  dockerfile: NonEmptyString,
  runtime: Schema.optional(EnvironmentRuntimeSchema),
})

export type EnvironmentRuntime = Schema.Schema.Type<
  typeof EnvironmentRuntimeSchema
>
export type EnvironmentConfig = Schema.Schema.Type<
  typeof EnvironmentConfigSchema
>

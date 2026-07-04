import { Schema } from "effect"

const NonEmptyString = Schema.String.check(Schema.isMinLength(1))

export const CourseEnvironmentConfigSchema = Schema.Array(
  Schema.Struct({
    courseId: NonEmptyString,
    environmentId: NonEmptyString,
  }),
)

export type CourseEnvironmentConfig = Schema.Schema.Type<
  typeof CourseEnvironmentConfigSchema
>

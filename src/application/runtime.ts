import { Effect, Layer } from "effect"
import { AppLayer } from "../services/index.js"

export type ApplicationServices = Layer.Success<typeof AppLayer>

export const runApplication = <A, E>(
  effect: Effect.Effect<A, E, ApplicationServices>,
): Promise<A> => Effect.runPromise(effect.pipe(Effect.provide(AppLayer)))

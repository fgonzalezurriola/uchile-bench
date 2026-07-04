import { Effect } from "effect"
import { HostDiscoveryService } from "../services/HostDiscoveryService.js"
import { AgentRegistryService } from "../services/AgentRegistryService.js"

/**
 * Doctor: check whether Docker, Pi, Bun, and agent configs are available.
 */
export const doctor = () =>
  Effect.gen(function* () {
    const hostDiscovery = yield* HostDiscoveryService
    const agentRegistry = yield* AgentRegistryService

    const hostChecks = yield* hostDiscovery.checkAll()
    const agentAvailabilities = yield* agentRegistry.listAvailabilities().pipe(
      Effect.catch(() => Effect.succeed([] as ReadonlyArray<{ agentId: string; available: boolean; reason?: string }>)),
    )

    return { hostChecks, agentAvailabilities } as const
  })

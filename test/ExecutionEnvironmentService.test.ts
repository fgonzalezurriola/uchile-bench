import { describe, test } from "bun:test"
import assert from "node:assert/strict"
import { Effect, Layer } from "effect"
import type { AgentConfig } from "../src/domain/Agent.js"
import type { EnvironmentConfig } from "../src/domain/Environment.js"
import {
  ExecutionEnvironmentService,
  ExecutionEnvironmentServiceLive,
  type ResolveExecutionEnvironmentOptions,
} from "../src/services/ExecutionEnvironmentService.js"
import { EnvironmentRegistryService } from "../src/services/EnvironmentRegistryService.js"

const baseAgentConfig: AgentConfig = {
  id: "test-agent",
  type: "pi",
  model: "test-model",
  provider: "test-provider",
  thinking: "medium",
  timeoutMinutes: 10,
  dockerImage: "agent-default:latest",
  envAllowlist: [],
}

const taskProfile: EnvironmentConfig = {
  id: "task-environment",
  dockerImage: "task-image:latest",
  dockerfile: "docker/task.Dockerfile",
}

const explicitProfile: EnvironmentConfig = {
  id: "explicit-environment",
  dockerImage: "explicit-image:latest",
  dockerfile: "docker/explicit.Dockerfile",
  runtime: {
    cpuLimit: "4",
  },
}

const resolveWithProfiles = (
  options: ResolveExecutionEnvironmentOptions,
  requestedEnvironmentIds: string[],
) => {
  const profiles = new Map([
    [taskProfile.id, taskProfile],
    [explicitProfile.id, explicitProfile],
  ])
  const registryLayer = Layer.succeed(EnvironmentRegistryService, {
    listEnvironmentIds: () => Effect.succeed([...profiles.keys()]),
    getEnvironmentConfig: (environmentId) => {
      requestedEnvironmentIds.push(environmentId)
      const profile = profiles.get(environmentId)
      return profile === undefined
        ? Effect.die(`Missing test environment: ${environmentId}`)
        : Effect.succeed(profile)
    },
  })
  const serviceLayer = ExecutionEnvironmentServiceLive.pipe(
    Layer.provide(registryLayer),
  )

  return Effect.gen(function*() {
    const service = yield* ExecutionEnvironmentService
    return yield* service.resolve(options)
  }).pipe(Effect.provide(serviceLayer))
}

describe("ExecutionEnvironmentService", () => {
  test("applies explicit CLI precedence over the Task environment", async () => {
    const requestedEnvironmentIds: string[] = []
    const resolved = await Effect.runPromise(
      resolveWithProfiles(
        {
          baseAgentConfig,
          explicitEnvironmentId: explicitProfile.id,
          taskEnvironmentId: taskProfile.id,
        },
        requestedEnvironmentIds,
      ),
    )

    assert.equal(resolved._tag, "EnvironmentProfile")
    if (resolved._tag !== "EnvironmentProfile") {
      assert.fail("Expected an Environment Profile")
    }
    assert.equal(resolved.environmentId, explicitProfile.id)
    assert.equal(resolved.profile, explicitProfile)
    assert.equal(resolved.agentConfig.dockerImage, explicitProfile.dockerImage)
    assert.equal(resolved.agentConfig.dockerfile, explicitProfile.dockerfile)
    assert.deepEqual(requestedEnvironmentIds, [explicitProfile.id])
  })

  test("uses the Task environment when there is no explicit override", async () => {
    const requestedEnvironmentIds: string[] = []
    const resolved = await Effect.runPromise(
      resolveWithProfiles(
        {
          baseAgentConfig,
          taskEnvironmentId: taskProfile.id,
        },
        requestedEnvironmentIds,
      ),
    )

    assert.equal(resolved._tag, "EnvironmentProfile")
    assert.equal(resolved.environmentId, taskProfile.id)
    assert.equal(resolved.agentConfig.dockerImage, taskProfile.dockerImage)
    assert.deepEqual(requestedEnvironmentIds, [taskProfile.id])
  })

  test("keeps the Agent default when no Environment Profile is selected", async () => {
    const requestedEnvironmentIds: string[] = []
    const resolved = await Effect.runPromise(
      resolveWithProfiles({ baseAgentConfig }, requestedEnvironmentIds),
    )

    assert.deepEqual(resolved, {
      _tag: "AgentDefault",
      environmentId: null,
      agentConfig: baseAgentConfig,
    })
    assert.deepEqual(requestedEnvironmentIds, [])
  })
})

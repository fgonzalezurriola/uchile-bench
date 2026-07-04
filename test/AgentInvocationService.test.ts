import { describe, test } from "bun:test"
import assert from "node:assert/strict"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import os from "node:os"
import path from "node:path"
import { Effect, Layer } from "effect"
import {
  JUDGE_PURPOSE,
  RUBRIC_GENERATOR_PURPOSE,
  SOLVER_PURPOSE,
  type AgentInvocationPurpose,
  type AgentRuntimeOptions,
} from "../src/adapters/AgentAdapter.js"
import type { AgentConfig } from "../src/domain/Agent.js"
import type { ResolvedExecutionEnvironment } from "../src/domain/Environment.js"
import {
  AgentInvocationService,
  AgentInvocationServiceLive,
} from "../src/services/AgentInvocationService.js"
import {
  AgentRegistryService,
  type AgentRegistryService as AgentRegistryShape,
} from "../src/services/AgentRegistryService.js"
import {
  DockerService,
  type DockerRunArgs,
  type DockerService as DockerServiceShape,
} from "../src/services/DockerService.js"
import {
  ExecutionEnvironmentService,
  type ExecutionEnvironmentService as ExecutionEnvironmentShape,
} from "../src/services/ExecutionEnvironmentService.js"
import { FileSystemServiceLive } from "../src/services/FileSystemService.js"
import { HashServiceLive } from "../src/services/HashService.js"

interface HarnessOptions {
  readonly config?: AgentConfig
  readonly environment?: ResolvedExecutionEnvironment
  readonly dockerAvailable?: boolean
  readonly imageAvailable?: boolean
}

const baseConfig: AgentConfig = {
  id: "pi-test",
  type: "pi",
  model: "test-model",
  provider: "test-provider",
  thinking: "medium",
  apiKey: "super-secret",
  timeoutMinutes: 5,
  dockerImage: "agent-image",
  envAllowlist: ["TEST_SECRET_TOKEN"],
}

const makeProfile = (config: AgentConfig): ResolvedExecutionEnvironment => ({
  _tag: "EnvironmentProfile",
  environmentId: "course-env",
  agentConfig: {
    ...config,
    dockerImage: "course-image",
    dockerfile: "environments/course.Dockerfile",
  },
  profile: {
    id: "course-env",
    dockerImage: "course-image",
    dockerfile: "environments/course.Dockerfile",
    runtime: {
      cpuLimit: "3",
      memoryLimit: "6g",
      pidsLimit: 99,
      networkMode: "none",
      environmentVariables: [
        { key: "COURSE_MODE", value: "1" },
        { key: "API_TOKEN", value: "secret-profile" },
      ],
      extraDockerArgs: ["--read-only"],
    },
  },
})

const capture = <A, E>(effect: Effect.Effect<A, E>) =>
  effect.pipe(
    Effect.map((value) => ({ _tag: "Success" as const, value })),
    Effect.catch((error) => Effect.succeed({ _tag: "Failure" as const, error })),
  )

const makeHarness = (options: HarnessOptions = {}) => {
  const root = mkdtempSync(path.join(os.tmpdir(), "agent-invocation-"))
  const config = options.config ?? baseConfig
  const environment = options.environment ?? makeProfile(config)
  const dockerCalls: DockerRunArgs[] = []
  const resolutionCalls: Array<{
    readonly agentId: string
    readonly taskEnvironmentId?: string
    readonly explicitEnvironmentId?: string
  }> = []

  const registry: AgentRegistryShape = {
    listAgentIds: () => Effect.succeed([config.id]),
    getAgentConfig: () => Effect.succeed(config),
    checkAvailability: () => Effect.succeed({ agentId: config.id, available: true }),
    listAvailabilities: () =>
      Effect.succeed([{ agentId: config.id, available: true }]),
  }

  const executionEnvironments: ExecutionEnvironmentShape = {
    resolve: (resolveOptions) => {
      resolutionCalls.push({
        agentId: resolveOptions.baseAgentConfig.id,
        ...(resolveOptions.taskEnvironmentId === undefined
          ? {}
          : { taskEnvironmentId: resolveOptions.taskEnvironmentId }),
        ...(resolveOptions.explicitEnvironmentId === undefined
          ? {}
          : { explicitEnvironmentId: resolveOptions.explicitEnvironmentId }),
      })
      return Effect.succeed(environment)
    },
  }

  const docker: DockerServiceShape = {
    isAvailable: Effect.succeed(options.dockerAvailable ?? true),
    imageExists: () => Effect.succeed(options.imageAvailable ?? true),
    buildImage: () => Effect.void,
    runContainer: (args) => {
      dockerCalls.push(args)
      if (args.stdoutPath !== undefined) {
        mkdirSync(path.dirname(args.stdoutPath), { recursive: true })
        writeFileSync(args.stdoutPath, "events")
      }
      if (args.stderrPath !== undefined) {
        mkdirSync(path.dirname(args.stderrPath), { recursive: true })
        writeFileSync(args.stderrPath, "")
      }
      return Effect.succeed({
        exitCode: 0,
        stdout: "events",
        stderr: "",
        ...(args.stdoutPath === undefined ? {} : { stdoutPath: args.stdoutPath }),
        ...(args.stderrPath === undefined ? {} : { stderrPath: args.stderrPath }),
        timedOut: false,
      })
    },
  }

  const dependencies = Layer.mergeAll(
    FileSystemServiceLive,
    HashServiceLive,
    Layer.succeed(AgentRegistryService, registry),
    Layer.succeed(ExecutionEnvironmentService, executionEnvironments),
    Layer.succeed(DockerService, docker),
  )
  const layer = AgentInvocationServiceLive.pipe(Layer.provide(dependencies))

  const invoke = (
    purpose: AgentInvocationPurpose,
    runtime: Omit<AgentRuntimeOptions, "purpose"> = {},
    container: {
      readonly timeoutMs?: number
      readonly cpuLimit?: string
    } = {},
    mountName = "workspace",
  ) => {
    const invocationRoot = path.join(root, purpose._tag)
    const program = Effect.gen(function*() {
      const service = yield* AgentInvocationService
      return yield* service.invoke({
        agent: {
          _tag: "CatalogAgent",
          agentId: config.id,
          taskEnvironmentId: "course-env",
        },
        prompt: `prompt-${purpose._tag}`,
        mounts: [
          {
            hostPath: path.join(root, mountName),
            containerPath: `/${mountName}`,
            readOnly: purpose._tag !== "Solver",
          },
        ],
        workDir: purpose._tag === "Solver" ? "/workspace" : "/tmp",
        agentHomePath: path.join(invocationRoot, "agent-home"),
        agentConfigPath: path.join(invocationRoot, "agent-config"),
        provenancePath: path.join(invocationRoot, "evidence"),
        capture: {
          eventsPath: path.join(invocationRoot, "events.jsonl"),
          stderrPath: path.join(invocationRoot, "stderr.log"),
        },
        runtime: { purpose, ...runtime },
        container,
      })
    })
    return {
      effect: program.pipe(Effect.provide(layer)),
      root: invocationRoot,
    }
  }

  return {
    root,
    dockerCalls,
    resolutionCalls,
    invoke,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  }
}

describe("AgentInvocationService", () => {
  test("resolves the adapter and reports an unknown adapter precisely", async () => {
    const unknownConfig: AgentConfig = { ...baseConfig, type: "missing" }
    const harness = makeHarness({
      config: unknownConfig,
      environment: {
        _tag: "AgentDefault",
        environmentId: null,
        agentConfig: unknownConfig,
      },
    })
    try {
      const invocation = harness.invoke(SOLVER_PURPOSE)
      const outcome = await Effect.runPromise(capture(invocation.effect))
      assert.equal(outcome._tag, "Failure")
      if (outcome._tag !== "Failure") return
      assert.equal(outcome.error._tag, "AgentAdapterNotFoundError")
      assert.match(outcome.error.message, /missing/)
    } finally {
      harness.cleanup()
    }
  })

  test("reports Docker and image availability failures precisely", async () => {
    for (const scenario of [
      { dockerAvailable: false, imageAvailable: true, tag: "DockerUnavailableError" },
      { dockerAvailable: true, imageAvailable: false, tag: "DockerImageUnavailableError" },
    ] as const) {
      const harness = makeHarness(scenario)
      try {
        const invocation = harness.invoke(JUDGE_PURPOSE)
        const outcome = await Effect.runPromise(capture(invocation.effect))
        assert.equal(outcome._tag, "Failure")
        if (outcome._tag !== "Failure") continue
        assert.equal(outcome.error._tag, scenario.tag)
      } finally {
        harness.cleanup()
      }
    }
  })

  test("preserves the Pi addon, applies the Environment Profile, and redacts persisted secrets", async () => {
    const previousSecret = process.env.TEST_SECRET_TOKEN
    process.env.TEST_SECRET_TOKEN = "runtime-secret"
    const harness = makeHarness()
    try {
      const invocation = harness.invoke(SOLVER_PURPOSE)
      const result = await Effect.runPromise(invocation.effect)
      assert.equal(result.adapter, "pi")
      assert.equal(result.image, "course-image")
      assert.equal(result.environmentId, "course-env")
      assert.equal(harness.resolutionCalls.length, 1)
      assert.equal(harness.dockerCalls.length, 1)
      const dockerCall = harness.dockerCalls[0]
      assert.ok(dockerCall)
      if (dockerCall === undefined) return
      assert.equal(dockerCall.cpuLimit, "3")
      assert.equal(dockerCall.memoryLimit, "6g")
      assert.equal(dockerCall.pidsLimit, 99)
      assert.equal(dockerCall.networkMode, "none")
      assert.deepEqual(dockerCall.extraArgs, ["--read-only"])
      assert.equal(dockerCall.timeoutMs, 5 * 60 * 1000)
      assert.match(dockerCall.command.join(" "), /--tools read,bash,edit,write/)

      const metadata = readFileSync(
        path.join(invocation.root, "agent-config", "prompt-metadata.json"),
        "utf8",
      )
      assert.match(metadata, /agent-prompt\.md/)
      assert.match(metadata, /Solver/)
      assert.match(metadata, /addonSha256/)
      const persisted = [
        "adapter-config.json",
        "environment.json",
        "invocation.json",
        "prompt-metadata.json",
      ].map((file) =>
        readFileSync(path.join(invocation.root, "agent-config", file), "utf8")
      ).join("\n")
      assert.doesNotMatch(persisted, /super-secret|runtime-secret|secret-profile/)
      assert.match(persisted, /\*\*\*/)
    } finally {
      if (previousSecret === undefined) delete process.env.TEST_SECRET_TOKEN
      else process.env.TEST_SECRET_TOKEN = previousSecret
      harness.cleanup()
    }
  })

  test("runtime overrides take precedence over adapter timeout and profile limits", async () => {
    const harness = makeHarness()
    try {
      const invocation = harness.invoke(
        JUDGE_PURPOSE,
        { thinking: "minimal", tools: ["read", "bash", "write"] },
        { timeoutMs: 12_345, cpuLimit: "7" },
      )
      await Effect.runPromise(invocation.effect)
      const dockerCall = harness.dockerCalls[0]
      assert.ok(dockerCall)
      if (dockerCall === undefined) return
      assert.equal(dockerCall.timeoutMs, 12_345)
      assert.equal(dockerCall.cpuLimit, "7")
      assert.equal(dockerCall.memoryLimit, "6g")
      assert.match(dockerCall.command.join(" "), /--thinking minimal/)
      assert.match(dockerCall.command.join(" "), /--tools read,bash,write/)
    } finally {
      harness.cleanup()
    }
  })

  test("copies OpenAI Codex credentials into the isolated Agent Home", async () => {
    const previousHome = process.env.HOME
    const home = mkdtempSync(path.join(os.tmpdir(), "pi-openai-home-"))
    const authDir = path.join(home, ".ai-task-bench", "pi-openai-codex")
    mkdirSync(authDir, { recursive: true })
    writeFileSync(path.join(authDir, "auth.json"), "{\"token\":\"local\"}\n")
    process.env.HOME = home

    const openAiConfig: AgentConfig = {
      ...baseConfig,
      provider: "openai-codex",
      apiKey: undefined,
      envAllowlist: [],
    }
    const harness = makeHarness({ config: openAiConfig })
    try {
      const invocation = harness.invoke(SOLVER_PURPOSE)
      await Effect.runPromise(invocation.effect)
      const dockerCall = harness.dockerCalls[0]
      assert.ok(dockerCall)
      if (dockerCall === undefined) return
      assert.equal(
        dockerCall.mounts.some((mount) =>
          mount.containerPath === "/agent-home/.pi/agent"
        ),
        false,
      )
      assert.equal(
        existsSync(path.join(
          invocation.root,
          "agent-home",
          ".pi",
          "agent",
          "auth.json",
        )),
        true,
      )
    } finally {
      if (previousHome === undefined) delete process.env.HOME
      else process.env.HOME = previousHome
      harness.cleanup()
      rmSync(home, { recursive: true, force: true })
    }
  })

  test("uses the same frontier with purpose-specific mounts and tools", async () => {
    const harness = makeHarness()
    try {
      const invocations = [
        harness.invoke(SOLVER_PURPOSE, {}, {}, "workspace"),
        harness.invoke(
          RUBRIC_GENERATOR_PURPOSE,
          { disableTools: true, outputMode: "text" },
          {},
          "rubric-output",
        ),
        harness.invoke(
          JUDGE_PURPOSE,
          { tools: ["read", "bash", "write"] },
          {},
          "submission",
        ),
      ]
      for (const invocation of invocations) {
        await Effect.runPromise(invocation.effect)
      }
      assert.equal(harness.dockerCalls.length, 3)
      const [solver, rubric, judge] = harness.dockerCalls
      assert.ok(solver && rubric && judge)
      if (solver === undefined || rubric === undefined || judge === undefined) return
      assert.ok(solver.mounts.some((mount) => mount.containerPath === "/workspace"))
      assert.ok(rubric.mounts.some((mount) => mount.containerPath === "/rubric-output"))
      assert.ok(judge.mounts.some((mount) => mount.containerPath === "/submission"))
      assert.match(solver.command.join(" "), /--tools read,bash,edit,write/)
      assert.match(rubric.command.join(" "), /--no-tools/)
      assert.match(judge.command.join(" "), /--tools read,bash,write/)
    } finally {
      harness.cleanup()
    }
  })
})

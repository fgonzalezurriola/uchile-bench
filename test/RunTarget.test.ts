import { describe, test } from "bun:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { Effect, Schema } from "effect"
import {
  JUDGE_PURPOSE,
  RUBRIC_GENERATOR_PURPOSE,
  SOLVER_PURPOSE,
} from "../src/adapters/AgentAdapter.js"
import {
  piPromptAddonFor,
} from "../src/adapters/pi/PiPromptAddon.js"
import { getAdapter } from "../src/adapters/registry.js"
import {
  DEFAULT_AGENT_ID,
  type AgentConfig,
} from "../src/domain/Agent.js"
import { parseRunCount } from "../src/domain/RunCount.js"
import { TaskIdSchema, type ResolvedTask } from "../src/domain/Task.js"
import {
  STANDALONE_BENCHMARK_PROMPT,
  cumulativeBenchmarkPrompt,
} from "../src/prompts/benchmarkPrompt.js"
import { judgePrompt } from "../src/prompts/judgePrompt.js"
import { rubricGenerationPrompt } from "../src/prompts/rubricGenerationPrompt.js"

const cumulativeTask: ResolvedTask = {
  id: Schema.decodeUnknownSync(TaskIdSchema)("course/t02"),
  source: {
    _tag: "CumulativeStage",
    sequenceId: "course",
    stageKey: "t02",
    stageIndex: 2,
  },
  title: "Tarea acumulativa",
  description: "Segunda etapa",
  evaluation: "manual",
  notes: {
    languageSpecified: true,
    starterProvided: true,
  },
  publicDir: "public",
  originalDir: "original",
  gradingDir: "grading",
  maxMinutes: 60,
  taskDir: "/tasks/course/t02",
  publicAbsPath: "/tasks/course/t02/public",
  originalAbsPath: "/tasks/course/t02/original",
  gradingAbsPath: "/tasks/course/t02/grading",
}

describe("RunCount", () => {
  test("parses positive integer strings and rejects zero", async () => {
    const parsed = await Effect.runPromise(parseRunCount("3"))
    assert.equal(parsed, 3)

    const error = await Effect.runPromise(parseRunCount(0).pipe(Effect.flip))
    assert.equal(error._tag, "BenchmarkConfigError")
  })
})

describe("benchmark prompts", () => {
  test("uses Spanish and distinguishes the first cumulative stage", () => {
    const firstStage = cumulativeBenchmarkPrompt("t01", 1)
    const laterStage = cumulativeBenchmarkPrompt("t02", 2)

    assert.match(STANDALONE_BENCHMARK_PROMPT, /Estás en un directorio/)
    assert.match(firstStage, /Esta es la primera etapa de la secuencia/)
    assert.doesNotMatch(firstStage, /trabajo realizado en etapas anteriores/)
    assert.match(laterStage, /ya contiene el trabajo realizado en etapas anteriores/)
    assert.match(laterStage, /Extiende la implementación existente/)
  })

  test("uses Spanish for rubric generation and judging", () => {
    const rubricPrompt = rubricGenerationPrompt(
      cumulativeTask,
      "Requisitos de la etapa actual.",
    )
    const reviewPrompt = judgePrompt(cumulativeTask, "run-1", "hash-1")

    assert.match(rubricPrompt, /^Crea una pauta de evaluación/)
    assert.match(rubricPrompt, /contexto de implementación/)
    assert.match(reviewPrompt, /^Evalúa la entrega/)
    assert.match(reviewPrompt, /Esta es una etapa acumulativa/)
  })
})

describe("PiAgentAdapter", () => {
  test("passes the configured condition and fixed isolation flags", () => {
    const config: AgentConfig = {
      id: "pi-minimax-m3-high-api",
      type: "pi",
      model: "MiniMax-M3",
      provider: "minimax",
      thinking: "high",
      timeoutMinutes: 180,
      dockerImage: "ai-task-bench-pi:latest",
      envAllowlist: ["MINIMAX_API_KEY"],
    }
    const adapter = getAdapter("pi")
    assert.ok(adapter)

    const command = adapter.buildDockerCommand(
      config,
      "Resuelve la tarea.",
      { purpose: SOLVER_PURPOSE, outputMode: "json" },
    ).join(" ")

    assert.match(command, /--provider minimax/)
    assert.match(command, /--model MiniMax-M3/)
    assert.match(command, /--thinking high/)
    assert.match(command, /--tools read,bash,edit,write/)
    assert.match(command, /--offline/)
    assert.match(command, /--no-session/)
    assert.match(command, /--no-extensions/)
    assert.match(command, /--no-skills/)
    assert.match(command, /--no-prompt-templates/)
    assert.match(command, /--no-context-files/)
    assert.match(command, /--no-approve/)
    assert.match(
      command,
      /--append-system-prompt \/agent-config\/agent-prompt\.md/,
    )
  })

  test("records the prompt strategy and fixed run condition", async () => {
    assert.equal(DEFAULT_AGENT_ID, "pi-minimax-m3-high-api")

    const config: AgentConfig = {
      id: DEFAULT_AGENT_ID,
      type: "pi",
      model: "MiniMax-M3",
      provider: "minimax",
      thinking: "high",
      timeoutMinutes: 180,
      dockerImage: "ai-task-bench-pi:latest",
      envAllowlist: ["MINIMAX_API_KEY"],
    }
    const adapter = getAdapter("pi")
    assert.ok(adapter)

    const prepared = JSON.parse(
      await Effect.runPromise(
        adapter.prepareAgentConfig(
          config,
          "Resuelve la tarea.",
          { purpose: SOLVER_PURPOSE },
        ),
      ),
    ) as Record<string, unknown>

    assert.equal(prepared.provider, "minimax")
    assert.equal(prepared.model, "MiniMax-M3")
    assert.equal(prepared.thinking, "high")
    assert.equal(prepared.piVersion, "0.80.2")
    assert.equal(prepared.systemPromptStrategy, "pi-base-plus-versioned-addon")
    assert.equal(prepared.invocationPurpose, "Solver")
    assert.deepEqual(prepared.tools, ["read", "bash", "edit", "write"])
    assert.equal(prepared.offlineStartup, true)
  })

  test("selects a distinct Spanish addon for rubric generation and judging", () => {
    const config: AgentConfig = {
      id: DEFAULT_AGENT_ID,
      type: "pi",
      model: "MiniMax-M3",
      provider: "minimax",
      thinking: "high",
      timeoutMinutes: 180,
      dockerImage: "ai-task-bench-pi:latest",
      envAllowlist: ["MINIMAX_API_KEY"],
    }
    const adapter = getAdapter("pi")
    assert.ok(adapter)

    const rubricCommand = adapter.buildDockerCommand(
      config,
      "Crea una pauta.",
      {
        purpose: RUBRIC_GENERATOR_PURPOSE,
        disableTools: true,
        outputMode: "text",
      },
    ).join(" ")
    const judgeCommand = adapter.buildDockerCommand(
      config,
      "Evalúa la entrega.",
      {
        purpose: JUDGE_PURPOSE,
        tools: ["read", "bash", "write"],
      },
    ).join(" ")

    assert.match(
      rubricCommand,
      /--append-system-prompt \/agent-config\/rubric-prompt\.md/,
    )
    assert.match(rubricCommand, /--no-tools/)
    assert.match(
      judgeCommand,
      /--append-system-prompt \/agent-config\/judge-prompt\.md/,
    )
    assert.match(judgeCommand, /--tools read,bash,write/)

    const solverAddon = piPromptAddonFor(SOLVER_PURPOSE)
    const rubricAddon = piPromptAddonFor(RUBRIC_GENERATOR_PURPOSE)
    const judgeAddon = piPromptAddonFor(JUDGE_PURPOSE)
    assert.match(
      readFileSync(solverAddon.sourcePath, "utf8"),
      /Estás resolviendo una tarea de programación/,
    )
    assert.match(
      readFileSync(rubricAddon.sourcePath, "utf8"),
      /Estás creando una pauta de evaluación/,
    )
    assert.match(
      readFileSync(judgeAddon.sourcePath, "utf8"),
      /Estás evaluando una entrega de programación/,
    )
  })
})

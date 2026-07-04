import { Effect } from "effect"
import type { AgentAdapter, AgentRuntimeOptions } from "../AgentAdapter.js"
import type { AgentConfig } from "../../domain/Agent.js"
import { normalizePiSessionEvents } from "./PiSessionNormalizer.js"
import {
  PI_DEFAULT_TOOLS,
  PI_DISCOVERY_POLICY,
  PI_SYSTEM_PROMPT_STRATEGY,
  PI_VERSION,
  piPromptAddonFor,
} from "./PiPromptAddon.js"

/** Runs every retained solver condition through Pi in an isolated container. */
export const PiAgentAdapter: AgentAdapter = {
  agentType: "pi",

  buildDockerCommand(
    config: AgentConfig,
    _prompt: string,
    runtime: AgentRuntimeOptions,
  ) {
    const promptAddon = piPromptAddonFor(runtime.purpose)
    const parts = [
      "$(command -v pi)",
      "--mode",
      runtime.outputMode ?? "json",
      "--no-session",
      "--offline",
      "--no-extensions",
      "--no-skills",
      "--no-prompt-templates",
      "--no-context-files",
      "--no-approve",
      "--append-system-prompt",
      promptAddon.containerPath,
      "--provider",
      config.provider,
      "--model",
      config.model,
      "--thinking",
      runtime.thinking ?? config.thinking,
    ]

    if (runtime.disableTools === true) {
      parts.push("--no-tools")
    } else {
      const tools = runtime.tools ?? PI_DEFAULT_TOOLS
      parts.push("--tools", tools.join(","))
    }

    if (config.apiKey !== undefined) {
      parts.push("--api-key", config.apiKey)
    }

    parts.push("-p")

    const command = parts
      .map((part) => (part.includes(" ") ? `"${part}"` : part))
      .join(" ")
    const readPrompt =
      `node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync("/agent-config/adapter-config.json", "utf8")).prompt)'`
    const shellCommand = `${readPrompt} | ${command}`

    return ["sh", "-c", shellCommand] as const as ReadonlyArray<string>
  },

  buildDockerEnv(config: AgentConfig) {
    const env: Array<{ key: string; value: string }> = [
      { key: "PI_TELEMETRY", value: "0" },
    ]

    for (const key of config.envAllowlist) {
      const value = process.env[key]
      if (value !== undefined && value.length > 0) {
        env.push({ key, value })
      }
    }

    return env
  },

  normalizeSessionEvents: normalizePiSessionEvents,

  getPromptAddon(runtime: AgentRuntimeOptions) {
    const promptAddon = piPromptAddonFor(runtime.purpose)
    const tools = runtime.disableTools === true
      ? []
      : runtime.tools ?? PI_DEFAULT_TOOLS
    return {
      sourcePath: promptAddon.sourcePath,
      file: promptAddon.file,
      containerPath: promptAddon.containerPath,
      metadata: {
        strategy: PI_SYSTEM_PROMPT_STRATEGY,
        piVersion: PI_VERSION,
        invocationPurpose: runtime.purpose._tag,
        addonFile: promptAddon.file,
        tools,
        offlineStartup: true,
      },
    }
  },

  getDockerImage(config: AgentConfig) {
    return config.dockerImage
  },

  getTimeoutMs(config: AgentConfig) {
    return config.timeoutMinutes * 60 * 1000
  },

  prepareAgentConfig(
    config: AgentConfig,
    prompt: string,
    runtime: AgentRuntimeOptions,
  ) {
    const promptAddon = piPromptAddonFor(runtime.purpose)
    const tools = runtime.disableTools === true
      ? []
      : runtime.tools ?? PI_DEFAULT_TOOLS
    return Effect.succeed(
      JSON.stringify(
        {
          type: config.type,
          provider: config.provider,
          model: config.model,
          thinking: runtime.thinking ?? config.thinking,
          apiKey: config.apiKey === undefined ? undefined : "***",
          prompt,
          piVersion: PI_VERSION,
          systemPromptStrategy: PI_SYSTEM_PROMPT_STRATEGY,
          invocationPurpose: runtime.purpose._tag,
          systemPromptAddon: {
            file: promptAddon.file,
            containerPath: promptAddon.containerPath,
          },
          tools,
          offlineStartup: true,
          nativeSession: {
            enabled: false,
            flag: "--no-session",
          },
          discovery: PI_DISCOVERY_POLICY,
          credentialSource: config.provider === "openai-codex"
            ? "isolated Pi OpenAI Codex home"
            : "environment or provider configuration",
          note: "Pi consumes CLI flags at runtime. HOME is /agent-home.",
        },
        null,
        2,
      ),
    )
  },
}

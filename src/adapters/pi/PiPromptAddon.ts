import { fileURLToPath } from "node:url"
import type { AgentInvocationPurpose } from "../AgentAdapter.js"

export const PI_VERSION = "0.80.2"
export const PI_SYSTEM_PROMPT_STRATEGY = "pi-base-plus-versioned-addon"
export const PI_DEFAULT_TOOLS = ["read", "bash", "edit", "write"] as const

export interface PiPromptAddonDefinition {
  readonly file: string
  readonly sourcePath: string
  readonly containerPath: string
}

const promptAddon = (file: string): PiPromptAddonDefinition => ({
  file,
  sourcePath: fileURLToPath(new URL(`../../../prompts/${file}`, import.meta.url)),
  containerPath: `/agent-config/${file}`,
})

export const PI_SOLVER_PROMPT_ADDON = promptAddon("agent-prompt.md")
export const PI_RUBRIC_PROMPT_ADDON = promptAddon("rubric-prompt.md")
export const PI_JUDGE_PROMPT_ADDON = promptAddon("judge-prompt.md")

export const piPromptAddonFor = (
  purpose: AgentInvocationPurpose,
): PiPromptAddonDefinition => {
  switch (purpose._tag) {
    case "Solver":
      return PI_SOLVER_PROMPT_ADDON
    case "RubricGenerator":
      return PI_RUBRIC_PROMPT_ADDON
    case "Judge":
      return PI_JUDGE_PROMPT_ADDON
  }
}

export const PI_DISCOVERY_POLICY = {
  extensions: false,
  skills: false,
  promptTemplates: false,
  contextFiles: false,
  projectApproval: false,
} as const

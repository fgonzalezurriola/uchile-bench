export interface ExperimentAgentAlias {
  readonly alias: string
  readonly agentId: string
}

export const EXPERIMENT_AGENT_ALIASES = [
  { alias: "minimax", agentId: "pi-minimax-m3-high-api" },
  { alias: "deepseek", agentId: "pi-zen-deepseek-v4-flash-free-xhigh" },
  { alias: "mimo", agentId: "pi-zen-mimo-v2.5-free-high" },
  { alias: "gpt-5.5-low", agentId: "pi-openai-gpt-5.5-low-subscription" },
  { alias: "gpt-5.5-medium", agentId: "pi-openai-gpt-5.5-medium-subscription" },
  { alias: "gpt-5.5-high", agentId: "pi-openai-gpt-5.5-high-subscription" },
  { alias: "gpt-5.4-medium", agentId: "pi-openai-gpt-5.4-medium-subscription" },
  {
    alias: "gpt-5.4-mini-medium",
    agentId: "pi-openai-gpt-5.4-mini-medium-subscription",
  },
] as const satisfies ReadonlyArray<ExperimentAgentAlias>

export const resolveExperimentAgent = (aliasOrAgentId: string): string =>
  EXPERIMENT_AGENT_ALIASES.find((entry) => entry.alias === aliasOrAgentId)
    ?.agentId ?? aliasOrAgentId

export const matchesExperimentPrefix = (
  targetId: string,
  prefix: string | undefined,
): boolean => {
  if (prefix === undefined || prefix.trim() === "") return true
  const normalized = prefix.replace(/^\/+|\/+$/g, "")
  return targetId === normalized || targetId.startsWith(`${normalized}/`)
}

import type { AgentAdapter } from "./AgentAdapter.js"
import { PiAgentAdapter } from "./pi/PiAgentAdapter.js"

const adapterMap: Record<string, AgentAdapter> = {
  pi: PiAgentAdapter,
}

export const getAdapter = (agentType: string): AgentAdapter | undefined =>
  adapterMap[agentType]

export const allAdapters = (): ReadonlyArray<AgentAdapter> =>
  Object.values(adapterMap)

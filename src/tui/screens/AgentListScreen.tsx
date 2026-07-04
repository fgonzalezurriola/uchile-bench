import React, { useState, useEffect } from "react"
import { Box, Text, useInput } from "ink"
import { listAgents } from "../../application/BenchmarkOperations.js"
import { runApplication } from "../../application/runtime.js"
import type { AgentAvailability } from "../../domain/Agent.js"

export const AgentListScreen: React.FC<{
  onBack: () => void
}> = ({ onBack }) => {
  const [agents, setAgents] = useState<ReadonlyArray<AgentAvailability>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void runApplication(listAgents()).then((result) => {
      setAgents(result)
      setLoading(false)
    })
  }, [])

  useInput((input) => {
    if (input === "q") onBack()
  })

  if (loading) {
    return <Text dimColor>Loading agents...</Text>
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        Agent Adapters
      </Text>
      {agents.length === 0 ? (
        <Text dimColor>No agents found.</Text>
      ) : (
        agents.map((agent) => (
          <Box key={agent.agentId} marginTop={1}>
            <Text color={agent.available ? "green" : "red"}>
              {agent.available ? "✓" : "✗"}
            </Text>
            <Text> {agent.agentId}</Text>
            {agent.reason && (
              <Text dimColor> — {agent.reason}</Text>
            )}
          </Box>
        ))
      )}
      <Box marginTop={1}>
        <Text dimColor>Press q to go back</Text>
      </Box>
    </Box>
  )
}

import React from "react"
import { Box, Text } from "ink"

export const RunProgressScreen: React.FC<{
  runId: string
  targetId: string
  agentId: string
  status: string
  elapsed: number
}> = ({ runId, targetId, agentId, status, elapsed }) => (
  <Box flexDirection="column" padding={1}>
    <Text bold color="cyan">
      Run Progress
    </Text>
    <Box flexDirection="column" marginTop={1}>
      <Text>
        Run: <Text bold>{runId}</Text>
      </Text>
      <Text>
        Target: {targetId} | Agent: {agentId}
      </Text>
      <Text>
        Status:{" "}
        <Text
          color={
            status === "completed"
              ? "green"
              : status === "failed"
                ? "red"
                : "yellow"
          }
        >
          {status}
        </Text>
      </Text>
      <Text>Elapsed: {elapsed.toFixed(0)}s</Text>
    </Box>
  </Box>
)

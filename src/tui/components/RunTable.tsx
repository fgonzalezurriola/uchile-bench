import React from "react"
import { Box, Text } from "ink"
import type { Run } from "../../domain/Run.js"

interface RunTableProps {
  runs: ReadonlyArray<Run>
}

export const RunTable: React.FC<RunTableProps> = ({ runs }) => {
  if (runs.length === 0) {
    return <Text dimColor>No runs found.</Text>
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>RUN ID</Text>
        <Text> </Text>
        <Text bold>STATUS</Text>
      </Box>
      {runs.map((run) => (
        <Box key={run.runId}>
          <Text>{run.runId}</Text>
          <Text> </Text>
          <Text color={run.status === "completed" ? "green" : run.status === "failed" ? "red" : "yellow"}>
            {run.status}
          </Text>
        </Box>
      ))}
    </Box>
  )
}

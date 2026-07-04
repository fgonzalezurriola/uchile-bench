import React from "react"
import { Box, Text, useInput } from "ink"
import type { Run } from "../../domain/Run.js"

export const RunInspectScreen: React.FC<{
  run: Run
  onBack: () => void
}> = ({ run, onBack }) => {
  useInput((input) => {
    if (input === "q" || input === "Escape") onBack()
  })

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        Run Inspect
      </Text>
      <Box flexDirection="column" marginTop={1}>
        <Text>
          Run ID: <Text bold>{run.runId}</Text>
        </Text>
        <Text>
          Task: {run.taskId} | Agent: {run.agentId}
        </Text>
        <Text>
          Status:{" "}
          <Text color={run.status === "completed" ? "green" : run.status === "failed" ? "red" : "yellow"}>
            {run.status}
          </Text>
        </Text>
        <Text>Duration: {run.durationSeconds ? `${run.durationSeconds.toFixed(1)}s` : "-"}</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Paths:</Text>
        {Object.entries(run.paths).map(([key, value]) => (
          <Text key={key} dimColor>
            {key}: {value}
          </Text>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press q to go back</Text>
      </Box>
    </Box>
  )
}

import React from "react"
import { Box, Text, useInput } from "ink"

export const HomeScreen: React.FC<{
  onNavigate: (screen: string) => void
}> = ({ onNavigate }) => {
  const options = [
    { key: "1", label: "List Targets", screen: "task-list" },
    { key: "2", label: "List Agents", screen: "agent-list" },
    { key: "3", label: "Run Benchmark", screen: "run-setup" },
    { key: "4", label: "Inspect Runs", screen: "run-inspect" },
    { key: "5", label: "Doctor", screen: "doctor" },
    { key: "q", label: "Quit", screen: "quit" },
  ]

  useInput((input) => {
    const option = options.find((candidate) => candidate.key === input)
    if (option !== undefined) onNavigate(option.screen)
  })

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        AI Task Bench
      </Text>
      <Text dimColor>Programming assignment benchmark runner</Text>
      <Box marginTop={1} flexDirection="column">
        {options.map((option) => (
          <Box key={option.key}>
            <Text>
              [{option.key}] {option.label}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

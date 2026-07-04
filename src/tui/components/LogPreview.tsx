import React from "react"
import { Box, Text } from "ink"

interface LogPreviewProps {
  path: string
  lines?: number
}

export const LogPreview: React.FC<LogPreviewProps> = ({ path, lines = 10 }) => {
  return (
    <Box flexDirection="column">
      <Text bold>Log: {path}</Text>
      <Text dimColor>(last {lines} lines shown)</Text>
    </Box>
  )
}

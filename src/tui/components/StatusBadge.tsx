import React from "react"
import { Box, Text } from "ink"

interface StatusBadgeProps {
  status: string
}

const statusColors: Record<string, string> = {
  pending: "yellow",
  preparing: "yellow",
  "copying-input": "yellow",
  "collecting-before-evidence": "cyan",
  "running-agent": "green",
  "collecting-after-evidence": "cyan",
  "exporting-output": "cyan",
  "creating-review": "cyan",
  completed: "green",
  failed: "red",
  cancelled: "gray",
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const color = statusColors[status] ?? "white"
  return (
    <Box>
      <Text color={color} bold>
        ● {status}
      </Text>
    </Box>
  )
}

import React from "react"
import { Box, Text, useInput } from "ink"

export const ReviewScreen: React.FC<{
  reviewPath: string
  onBack: () => void
}> = ({ reviewPath, onBack }) => {
  useInput((input) => {
    if (input === "q" || input === "Escape") onBack()
  })

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        Review
      </Text>
      <Box flexDirection="column" marginTop={1}>
        <Text>Review directory: {reviewPath}</Text>
        <Text dimColor>Edit review.md and score.json in the above directory</Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press q to go back</Text>
      </Box>
    </Box>
  )
}

import React, { useEffect, useState } from "react"
import { Box, Text, useInput } from "ink"
import { runDoctor } from "../../application/BenchmarkOperations.js"
import { runApplication } from "../../application/runtime.js"
import type { HostCheckResult } from "../../services/HostDiscoveryService.js"

export const DoctorScreen: React.FC<{
  onBack: () => void
}> = ({ onBack }) => {
  const [checks, setChecks] = useState<ReadonlyArray<HostCheckResult>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void runApplication(runDoctor()).then((result) => {
      setChecks(result.hostChecks)
      setLoading(false)
    })
  }, [])

  useInput((input) => {
    if (input === "q" || input === "Escape") onBack()
  })

  if (loading) return <Text dimColor>Running checks...</Text>

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        Doctor
      </Text>
      <Box flexDirection="column" marginTop={1}>
        <Text bold>Host Checks:</Text>
        {checks.map((check) => (
          <Box key={check.name}>
            <Text color={check.available ? "green" : "red"}>
              {check.available ? "✓" : "✗"}
            </Text>
            <Text> {check.name}</Text>
            {check.version && <Text dimColor> v{check.version}</Text>}
            {check.notes && <Text dimColor> — {check.notes}</Text>}
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press q to go back</Text>
      </Box>
    </Box>
  )
}

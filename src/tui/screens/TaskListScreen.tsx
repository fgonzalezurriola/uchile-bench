import React, { useEffect, useState } from "react"
import { Box, Text, useInput } from "ink"
import { listBenchmarkTargets } from "../../application/BenchmarkOperations.js"
import { runApplication } from "../../application/runtime.js"
import type { BenchmarkTarget } from "../../domain/BenchmarkTarget.js"

export const TaskListScreen: React.FC<{
  onBack: () => void
}> = ({ onBack }) => {
  const [targets, setTargets] = useState<ReadonlyArray<BenchmarkTarget>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void runApplication(listBenchmarkTargets()).then((result) => {
      setTargets(result)
      setLoading(false)
    })
  }, [])

  useInput((input) => {
    if (input === "q" || input === "Escape") onBack()
  })

  if (loading) return <Text dimColor>Loading Benchmark Targets...</Text>

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Benchmark Targets</Text>
      {targets.length === 0 ? (
        <Text dimColor>No Benchmark Targets found.</Text>
      ) : (
        targets.map((target) => (
          <Box key={target.id} flexDirection="column" marginTop={1}>
            <Text bold>{target.id}: {target.title}</Text>
            <Text dimColor>{target.description}</Text>
            <Text dimColor>
              {target._tag === "StandaloneTask"
                ? `Standalone | Max ${target.task.maxMinutes}min | ${target.task.evaluation}`
                : `Cumulative | ${target.stages.length} stages`}
            </Text>
          </Box>
        ))
      )}
      <Box marginTop={1}><Text dimColor>Press q to go back</Text></Box>
    </Box>
  )
}

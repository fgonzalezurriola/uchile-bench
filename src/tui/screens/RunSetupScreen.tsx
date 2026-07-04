import React, { useEffect, useState } from "react"
import { Box, Text, useInput } from "ink"
import {
  listAgents,
  listBenchmarkTargets,
} from "../../application/BenchmarkOperations.js"
import { runApplication } from "../../application/runtime.js"

export const RunSetupScreen: React.FC<{
  onBack: () => void
  onStart: (config: {
    targetId: string
    agentId: string
    runs: number
    timeout: number
  }) => void
}> = ({ onBack, onStart }) => {
  const [targetIds, setTargetIds] = useState<string[]>([])
  const [agentIds, setAgentIds] = useState<string[]>([])
  const [step, setStep] = useState(0)
  const [targetId, setTargetId] = useState("")
  const [agentId, setAgentId] = useState("")
  const [runs, setRuns] = useState("1")
  const [timeout, setTimeout] = useState("45")

  useEffect(() => {
    void Promise.all([
      runApplication(listBenchmarkTargets()),
      runApplication(listAgents()),
    ]).then(([targets, agents]) => {
      setTargetIds(targets.map((target) => target.id))
      setAgentIds(agents.map((agent) => agent.agentId))
    })
  }, [])

  useInput((input) => {
    if (input === "q") onBack()

    if (step === 0) {
      const number = parseInt(input)
      const selected = targetIds[number - 1]
      if (number >= 1 && selected !== undefined) {
        setTargetId(selected)
        setStep(1)
      }
    } else if (step === 1) {
      const number = parseInt(input)
      const selected = agentIds[number - 1]
      if (number >= 1 && selected !== undefined) {
        setAgentId(selected)
        setStep(2)
      }
    } else if (step === 2) {
      if (input === "Enter" || input === "\r") {
        setStep(3)
      } else if (/^\d$/.test(input)) {
        setRuns(runs + input)
      }
    } else if (step === 3) {
      if (input === "Enter" || input === "\r") {
        onStart({
          targetId,
          agentId,
          runs: parseInt(runs) || 1,
          timeout: parseInt(timeout) || 45,
        })
      } else if (/^\d$/.test(input)) {
        setTimeout(timeout + input)
      }
    }
  })

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        Run Setup
      </Text>

      {step === 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold>Select target:</Text>
          {targetIds.map((id, index) => (
            <Text key={id}>
              [{index + 1}] {id}
            </Text>
          ))}
        </Box>
      )}

      {step === 1 && (
        <Box flexDirection="column" marginTop={1}>
          <Text>
            Target: <Text bold>{targetId}</Text>
          </Text>
          <Text bold>Select agent:</Text>
          {agentIds.map((id, index) => (
            <Text key={id}>
              [{index + 1}] {id}
            </Text>
          ))}
        </Box>
      )}

      {step === 2 && (
        <Box flexDirection="column" marginTop={1}>
          <Text>
            Target: <Text bold>{targetId}</Text> | Agent: <Text bold>{agentId}</Text>
          </Text>
          <Text bold>Number of runs: {runs}</Text>
          <Text dimColor>Type digits, then Enter</Text>
        </Box>
      )}

      {step === 3 && (
        <Box flexDirection="column" marginTop={1}>
          <Text>
            Target: <Text bold>{targetId}</Text> | Agent: <Text bold>{agentId}</Text> | Runs: <Text bold>{runs}</Text>
          </Text>
          <Text bold>Timeout (minutes): {timeout}</Text>
          <Text dimColor>Type digits, then Enter to start</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>Press q to go back</Text>
      </Box>
    </Box>
  )
}

import React, { useState } from "react"
import { Text, render } from "ink"
import { HomeScreen } from "./screens/HomeScreen.js"
import { TaskListScreen } from "./screens/TaskListScreen.js"
import { AgentListScreen } from "./screens/AgentListScreen.js"
import { RunSetupScreen } from "./screens/RunSetupScreen.js"
import { RunProgressScreen } from "./screens/RunProgressScreen.js"
import { DoctorScreen } from "./screens/DoctorScreen.js"

const App: React.FC = () => {
  const [screen, setScreen] = useState("home")
  const [runConfig, setRunConfig] = useState<{
    targetId: string
    agentId: string
    runs: number
    timeout: number
  } | null>(null)

  const goHome = () => setScreen("home")

  switch (screen) {
    case "home":
      return <HomeScreen onNavigate={setScreen} />

    case "task-list":
      return <TaskListScreen onBack={goHome} />

    case "agent-list":
      return <AgentListScreen onBack={goHome} />

    case "run-setup":
      return (
        <RunSetupScreen
          onBack={goHome}
          onStart={(config) => {
            setRunConfig(config)
            setScreen("run-progress")
          }}
        />
      )

    case "run-progress":
      if (!runConfig) return <Text>No run config</Text>
      return (
        <RunProgressScreen
          runId="starting..."
          targetId={runConfig.targetId}
          agentId={runConfig.agentId}
          status="pending"
          elapsed={0}
        />
      )

    case "doctor":
      return <DoctorScreen onBack={goHome} />

    case "quit":
      return <Text>Goodbye!</Text>

    default:
      return <Text>Unknown screen: {screen}</Text>
  }
}

export const renderTui = async () => {
  const { waitUntilExit } = render(<App />)
  await waitUntilExit()
}

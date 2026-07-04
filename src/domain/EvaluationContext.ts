export type TaskExecutionContext =
  | {
      readonly _tag: "Standalone"
    }
  | {
      readonly _tag: "CumulativeStage"
      readonly sequenceId: string
      readonly stageKey: string
      readonly stageIndex: number
    }

import { Effect } from "effect"
import type { Run } from "../domain/Run.js"
import { EvidenceService } from "../services/EvidenceService.js"

/** Collect tree, file list, input hash, prompt, and adapter configuration. */
export const collectBeforeEvidence = Effect.fnUntraced(function*(
  run: Run,
  prompt: string,
  agentConfigJson: string,
) {
  const evidence = yield* EvidenceService
  return yield* evidence.collectBeforeEvidence(
    run.paths.workspace,
    run.paths.evidence,
    run.paths.input,
    prompt,
    agentConfigJson,
  )
})

/** Capture Output and post-execution Evidence without mutating Run state. */
export const collectAfterEvidence = Effect.fnUntraced(function*(run: Run) {
  const evidence = yield* EvidenceService
  return yield* evidence.collectAfterEvidence(
    run.paths.workspace,
    run.paths.evidence,
    run.paths.output,
  )
})

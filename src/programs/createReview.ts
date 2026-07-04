import { Effect } from "effect"
import { FileSystemService } from "../services/FileSystemService.js"
import { EvidenceService } from "../services/EvidenceService.js"

/**
 * Create review files if they don't exist and return the review path.
 */
export const createReview = (runDir: string) =>
  Effect.gen(function* () {
    const evidence = yield* EvidenceService
    const fs = yield* FileSystemService

    const reviewPath = `${runDir}/06-review`
    const scorePath = `${reviewPath}/score.json`
    const exists = yield* fs.exists(scorePath)

    if (!exists) {
      yield* evidence.createReviewFiles(reviewPath)
    }

    return reviewPath
  })

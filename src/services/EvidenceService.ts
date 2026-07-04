import { Context, Effect, Layer } from "effect"
import { FileSystemService } from "./FileSystemService.js"
import { HashService } from "./HashService.js"
import type { RunEvidence } from "../domain/Run.js"
import { emptyReviewScore } from "../domain/Review.js"
import { EvidenceFile } from "../domain/Evidence.js"
import { FileSystemError } from "../domain/Errors.js"

export interface AgentPromptMetadata {
  readonly strategy: string
  readonly piVersion: string
  readonly invocationPurpose: "Solver" | "RubricGenerator" | "Judge"
  readonly addonFile: string
  readonly addonSha256: string
  readonly tools: ReadonlyArray<string>
  readonly offlineStartup: boolean
}

export interface EvidenceService {
  readonly preserveAgentPromptAddon: (
    sourcePath: string,
    agentConfigPath: string,
    evidencePath: string,
    metadata: Omit<AgentPromptMetadata, "addonSha256">,
  ) => Effect.Effect<AgentPromptMetadata, FileSystemError>
  readonly collectBeforeEvidence: (
    workspacePath: string,
    evidencePath: string,
    inputPath: string,
    prompt: string,
    agentConfigJson: string,
  ) => Effect.Effect<{ inputHash: string; evidence: Partial<RunEvidence> }, FileSystemError>
  readonly collectAfterEvidence: (
    workspacePath: string,
    evidencePath: string,
    outputPath: string,
  ) => Effect.Effect<{ outputHash: string; evidence: Partial<RunEvidence> }, FileSystemError>
  readonly createReviewFiles: (reviewPath: string, maxScore?: number) => Effect.Effect<void, FileSystemError>
}

export const EvidenceService = Context.Service<EvidenceService>("EvidenceService")

export const EvidenceServiceLive = Layer.effect(
  EvidenceService,
  Effect.gen(function* () {
    const fs = yield* FileSystemService
    const hash = yield* HashService

    const preserveAgentPromptAddon = (
      sourcePath: string,
      agentConfigPath: string,
      evidencePath: string,
      metadata: Omit<AgentPromptMetadata, "addonSha256">,
    ) =>
      Effect.gen(function* () {
        const addonContent = yield* fs.readFile(sourcePath)
        const agentConfigAddonPath = `${agentConfigPath}/${metadata.addonFile}`
        const evidenceAddonPath = `${evidencePath}/${EvidenceFile.AGENT_PROMPT}`

        yield* fs.writeFile(agentConfigAddonPath, addonContent)
        yield* fs.writeFile(evidenceAddonPath, addonContent)

        const addonSha256 = yield* hash.hashFile(evidenceAddonPath)
        const promptMetadata: AgentPromptMetadata = {
          ...metadata,
          addonSha256,
        }
        yield* fs.writeJson(
          `${evidencePath}/${EvidenceFile.PROMPT_METADATA}`,
          promptMetadata,
        )

        return promptMetadata
      })

    const collectBeforeEvidence = (
      workspacePath: string,
      evidencePath: string,
      inputPath: string,
      prompt: string,
      agentConfigJson: string,
    ) =>
      Effect.gen(function* () {
        yield* fs.mkdirRecursive(evidencePath)

        const treeBeforeProc = Bun.spawnSync(["find", workspacePath, "-type", "f"])
        const treeBefore = treeBeforeProc.stdout?.toString() ?? ""
        yield* fs.writeFile(`${evidencePath}/${EvidenceFile.TREE_BEFORE}`, treeBefore)

        const filesBefore = treeBefore.split("\n").filter((s) => s.length > 0).sort()
        yield* fs.writeJson(`${evidencePath}/${EvidenceFile.FILES_BEFORE}`, filesBefore)

        const inputHash = yield* hash.hashDirectory(inputPath)
        yield* fs.writeFile(`${evidencePath}/${EvidenceFile.PROMPT}`, prompt)
        yield* fs.writeFile(`${evidencePath}/${EvidenceFile.AGENT_CONFIG}`, agentConfigJson)

        return {
          inputHash,
          evidence: { treeBefore: EvidenceFile.TREE_BEFORE, filesBefore: EvidenceFile.FILES_BEFORE },
        }
      })

    const collectAfterEvidence = (
      workspacePath: string,
      evidencePath: string,
      outputPath: string,
    ) =>
      Effect.gen(function* () {
        // Preserve Output first so later Evidence failures do not discard the
        // Solver's final filesystem state.
        yield* fs.copyDir(workspacePath, outputPath)

        const treeAfterProc = Bun.spawnSync(["find", workspacePath, "-type", "f"])
        const treeAfter = treeAfterProc.stdout?.toString() ?? ""
        yield* fs.writeFile(`${evidencePath}/${EvidenceFile.TREE_AFTER}`, treeAfter)

        const filesAfter = treeAfter.split("\n").filter((s) => s.length > 0).sort()
        yield* fs.writeJson(`${evidencePath}/${EvidenceFile.FILES_AFTER}`, filesAfter)

        let filesBefore: string[] = []
        try {
          const beforeContent = yield* fs.readFile(`${evidencePath}/${EvidenceFile.FILES_BEFORE}`)
          filesBefore = JSON.parse(beforeContent)
        } catch {
          /* ignore */
        }

        const filesBeforeSet = new Set(filesBefore)
        const created = filesAfter.filter((f) => !filesBeforeSet.has(f))
        yield* fs.writeFile(`${evidencePath}/${EvidenceFile.FILES_CREATED}`, created.join("\n") + "\n")
        const modified = filesAfter.filter((f) => filesBeforeSet.has(f))
        yield* fs.writeFile(`${evidencePath}/${EvidenceFile.FILES_MODIFIED}`, modified.join("\n") + "\n")

        const inputPath = outputPath.replace("/04-output", "/00-input")
        const diffProc = Bun.spawnSync(["diff", "-ruN", inputPath, workspacePath], {
          stdout: "pipe",
          stderr: "pipe",
        })
        const diffPatch = diffProc.stdout?.toString() ?? ""
        yield* fs.writeFile(`${evidencePath}/${EvidenceFile.DIFF_PATCH}`, diffPatch)

        const outputHash = yield* hash.hashDirectory(workspacePath)

        return {
          outputHash,
          evidence: {
            treeAfter: EvidenceFile.TREE_AFTER,
            filesAfter: EvidenceFile.FILES_AFTER,
            diffPatch: EvidenceFile.DIFF_PATCH,
          },
        }
      })

    const createReviewFiles = (reviewPath: string, maxScore = 7) =>
      Effect.gen(function* () {
        yield* fs.mkdirRecursive(reviewPath)

        const reviewMd = `# Review: ${reviewPath.split("/").slice(-2).join("/")}

## Summary

<!-- Write your review summary here -->

## Categories

| Category | Score | Notes |
|----------|-------|-------|
| Requirements | /1 | |
| Correctness | /1 | |
| Completeness | /1 | |
| Executability | /1 | |
| Code Quality | /1 | |
| Documentation | /1 | |
| **Total** | /${maxScore} | |

## Notes

<!-- Additional notes -->
`
        yield* fs.writeFile(`${reviewPath}/review.md`, reviewMd)
        yield* fs.writeJson(`${reviewPath}/score.json`, emptyReviewScore(maxScore))
      })

    return {
      preserveAgentPromptAddon,
      collectBeforeEvidence,
      collectAfterEvidence,
      createReviewFiles,
    } satisfies EvidenceService
  }),
)

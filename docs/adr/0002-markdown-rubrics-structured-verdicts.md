# 0002: Markdown rubrics and structured judge verdicts

## Status

Accepted.

## Context

The benchmark contains Tasks whose requirements and grading rules are expressed in heterogeneous forms. Some assignments use point tables, others embed requirements in source-code comments or exported notebooks, others define separate code and report components, and some rely primarily on execution gates, grade caps, or explicit deductions.

A single rigid rubric JSON that forces every Task into 100 points loses original grading information and requires the rubric generator to normalize or invent structure before human review. At the same time, AI Judge results must remain machine-readable, auditable, and suitable for aggregate analysis.

Rubric preparation is part of dataset curation. It is completed and approved before benchmark Runs begin.

## Decision

Use a reviewed Markdown document as the Approved Rubric for each Task:

- `grading/rubric.draft.md` is generated as a curation aid;
- a human reviews and edits the draft;
- `grading/rubric.md` is the Approved Rubric used for benchmark judging;
- `grading/rubric.approval.json` records its hash and approval metadata.

The rubric generator receives all relevant textual Public Material and non-generated Grading Material. It must not assume that the Assignment Statement is a single Markdown file. The generated rubric follows a common human-readable outline while preserving the Task's original points, sections, weights, grade rules, and discounts when present. Proposed allocations must be identified as proposals rather than source requirements.

The AI Judge reads the Approved Rubric and produces a structured `verdict.json`. Each criterion assessment reports its original awarded and maximum points plus its effective weight in the final score. Grade-level discounts, caps, and overrides are represented separately. The host validates the verdict, computes weighted completion, maps it linearly to the 1.0–7.0 benchmark scale, applies explicit grade adjustments, bounds the result, and rounds to one decimal.

The Solver never receives Grading Material or the Approved Rubric.

## Alternatives considered

### Keep a mandatory 100-point rubric JSON

Rejected because it obscures original scales such as 4, 6, or 60 points, introduces avoidable rounding, and poorly represents assignments dominated by gates or grade deductions.

### Let the rubric and verdict both be free-form Markdown

Rejected because verdicts must support schema validation, deterministic arithmetic, aggregate analysis, and automated review rendering.

### Let the judge calculate and report only a final grade

Rejected because a final grade without criterion-level evidence and machine-checkable arithmetic is insufficient for audit and reproducibility.

## Consequences

- Rubric generation is flexible with respect to input file types and assignment layout.
- Human reviewers can edit rubrics naturally without maintaining a large JSON document.
- Judge verdicts remain structured and comparable across Tasks.
- The host can verify arithmetic but cannot prove that a judge interpreted every Markdown rule correctly; rubric hashes, evidence, human-review flags, and reproducible judge Runs provide the audit trail.
- Existing JSON rubrics must be regenerated or manually migrated before they can be used by the new judging flow.
- Rubric approval becomes a prerequisite for benchmark judging, not part of each Solver Run.

# AI Task Bench agent instructions

## Project purpose

This benchmark evaluates whether current AI systems can solve a broad share of conventional university programming assessments from the same public material given to students. The broader research goal is to produce auditable evidence about whether educational evaluation should move toward reasoning, oral defense, iteration, design decisions, collaboration, and demonstrated understanding rather than relying mainly on the submitted artifact.

Preserve experimental validity. Never expose `original/`, `grading/`, sibling targets, previous runs, repository files, credentials, or host configuration to the solver agent.

## Target model

- `tasks/standalone/**/task.json`: independent target; starts from its own `public/`.
- `tasks/cumulative/<sequence-id>/<stage-key>/task.json`: cumulative stage; starts from the preceding output except for the first stage.
- Cumulative stages are ordered alphabetically by directory name. Use zero-padded keys such as `t01`, `t02`, and `t10`.
- Target IDs derive from paths below their catalog roots. Do not add IDs to manifests.
- Adding a target must not require changing CLI or source-code registries.

## TypeScript and Effect

- Read existing modules and benchmark validation scripts before editing.
- Prefer Effect services and layers for external capabilities.
- Use Effect Schema to parse unknown input at boundaries.
- Model expected failures with precise tagged errors.
- Use tagged unions instead of boolean behavior switches.
- Prefer `Effect.fnUntraced` for reusable functions that only construct effects.
- Use class syntax for `Context.Service`.
- Use `Clock` and `DateTime` for runtime time.
- Do not use `async`/`await` or `try`/`catch` inside Effect programs.
- Avoid `any`, non-null assertions, and unjustified casts.
- Keep task, sequence, and run provenance explicit and auditable.

## Domain docs

This is a single-context repository. Read `CONTEXT.md` before domain or architecture work and consult relevant records under `docs/adr/`. Consumer rules live in `docs/agents/domain.md`.

Use the vocabulary defined in `CONTEXT.md` in code, tests, plans, and review findings. Update it only when durable terminology, relationships, invariants, or ambiguities change.

## Excluded workflows

This repository does not use agent-managed issues or triage. Do not assume an issue tracker, triage labels, or issue-backed implementation flow.

## Validation

Run the narrowest relevant checks for the files changed. For web-only changes, prefer:

```bash
bun run web:build
```

For benchmark engine, catalog, task, rubric, environment, or run-lifecycle changes, use the broader benchmark checks as needed.

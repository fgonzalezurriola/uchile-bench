# Domain Docs

How engineering agents should consume this repository's domain documentation.

## Before exploring

Read:

- `CONTEXT.md` at the repository root.
- Relevant decisions under `docs/adr/`.

If a file does not exist, proceed without treating its absence as an error.

## Layout

This is a single-context repository:

```text
/
├── CONTEXT.md
├── docs/
│   ├── agents/domain.md
│   └── adr/
└── src/
```

Do not create `CONTEXT-MAP.md` unless the repository is deliberately split into independent bounded contexts.

## Vocabulary

Use terms as defined in `CONTEXT.md` in code, tests, documentation, plans, and review findings. Do not introduce synonyms for an existing domain term without resolving the ambiguity first.

When a real domain gap is discovered, update `CONTEXT.md` as part of the same change. Keep it focused on durable language, relationships, invariants, and known ambiguities rather than implementation details.

## Architectural decisions

Create an ADR only for a durable decision with meaningful alternatives or consequences. Use the next numeric filename under `docs/adr/`, for example:

```text
docs/adr/0001-example-decision.md
```

If a proposed change contradicts an ADR, identify the conflict explicitly instead of silently overriding the decision.

## Excluded workflow

This repository does not configure an issue tracker or triage labels. Do not assume that work is represented as issues, and do not invoke issue or triage workflows unless the user explicitly changes this policy.

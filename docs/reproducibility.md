# Reproducing AI Task Bench experiments

This document defines the reference protocol for comparable benchmark runs.

## Solver conditions

The agent catalog contains only study conditions with an explicit harness, provider, model, reasoning level, and image capability.

| Purpose | Agent ID | Harness | Provider | Model | Pi thinking | Images |
| --- | --- | --- | --- | --- | --- | --- |
| Reference baseline | `pi-openai-gpt-5.4-mini-medium-subscription` | Pi | `openai-codex` | `gpt-5.4-mini` | `medium` | Yes |
| GPT comparison | `pi-openai-gpt-5.4-medium-subscription` | Pi | `openai-codex` | `gpt-5.4` | `medium` | Yes |
| GPT comparison | `pi-openai-gpt-5.5-medium-subscription` | Pi | `openai-codex` | `gpt-5.5` | `medium` | Yes |
| GPT rubric/judge default | `pi-openai-gpt-5.5-high-subscription` | Pi | `openai-codex` | `gpt-5.5` | `high` | Yes |
| DeepSeek comparison | `pi-zen-deepseek-v4-flash-free-xhigh` | Pi | `opencode` | `opencode/deepseek-v4-flash-free` | `xhigh`, provider `max` | No |
| MiMo comparison | `pi-zen-mimo-v2.5-free-high` | Pi | `opencode` | `opencode/mimo-v2.5-free` | `high` | No |
| MiniMax comparison | `pi-minimax-m3-high-api` | Pi | `minimax` | `MiniMax-M3` | `high` | Yes |

All retained conditions use Pi as the coding-agent harness. This avoids confounding model comparisons with differences between Pi and direct provider-specific agent execution. The CLI solver default remains `pi-minimax-m3-high-api`; rubric generation and AI judging default to `pi-openai-gpt-5.5-high-subscription`. Reported experiments should pass `--agent` explicitly.

The model and reasoning level selected in an interactive Pi session are irrelevant to benchmark runs. Each agent JSON passes an explicit provider, model, and `--thinking` value.

The capability matrix comes from Pi `0.80.2`, pinned in the benchmark Dockerfiles. That catalog maps DeepSeek V4 Flash `xhigh` to provider effort `max`. A Pi upgrade may change model capabilities, context windows, output limits, reasoning mappings, thinking budgets, or event schemas; treat it as a changed experimental condition and revalidate the catalog.

## Prompt, tools, and multimodal controls

Pi keeps its normal base system prompt and appends one explicit, versioned Spanish addon according to the invocation purpose:

| Purpose | Addon | Container path |
| --- | --- | --- |
| Solver | [`prompts/agent-prompt.md`](../prompts/agent-prompt.md) | `/agent-config/agent-prompt.md` |
| Rubric generator | [`prompts/rubric-prompt.md`](../prompts/rubric-prompt.md) | `/agent-config/rubric-prompt.md` |
| Judge | [`prompts/judge-prompt.md`](../prompts/judge-prompt.md) | `/agent-config/judge-prompt.md` |

Each invocation passes the selected file with `--append-system-prompt`; no addon replaces Pi's base prompt. Solver runs stage the addon in `03-agent-config/` and preserve the exact bytes in `05-evidence/`. Rubric and judge invocations preserve their addon inside the isolated generation or review `agent-config/` directory. The corresponding `prompt-metadata.json` records the strategy `pi-base-plus-versioned-addon`, invocation purpose, Pi version, addon filename, SHA-256, tool allowlist, and offline-startup setting.

Every solver run uses the allowlist `read,bash,edit,write`. Rubric generation disables tools because all textual context is embedded in its prompt. Judging uses `read,bash,write` so it can inspect materials, run checks in its disposable workspace, and write only the requested verdict. Pi's `read` tool passes images as attachments. The solver allowlist does not disable vision and does not imply a fifth image tool. Pi omits the attachment when the selected model does not declare image support. Classify targets as text-only or multimodal and report that class when comparing conditions with different image capabilities.

The harness also passes `--offline`, `--no-session`, `--no-extensions`, `--no-skills`, `--no-prompt-templates`, `--no-context-files`, and `--no-approve`, and sets `PI_TELEMETRY=0`. `--offline` disables Pi startup and package-management network operations; it does not block provider inference calls.

## Required host capabilities

A reproducing host needs:

- the exact Git commit used for the experiment;
- Bun and dependencies resolved by `bun.lock`;
- Docker with permission to build and run containers;
- network access to the selected provider for real runs;
- a ChatGPT Plus or Pro account with Codex access for GPT profiles;
- `MINIMAX_API_KEY` in the host environment for MiniMax M3.

Record before every reported experiment:

```bash
git rev-parse HEAD
git status --short
bun --version
docker --version
docker image inspect ai-task-bench-pi:latest --format '{{.Id}}'
```

Also record the date, host OS and architecture, agent ID, target IDs, number of repetitions, run IDs, and Docker image ID or digest. The run prompt metadata records Pi `0.80.2`; the image can also be checked locally with `pi --version` without invoking a model.

## Installation and validation

```bash
bun install --frozen-lockfile
bun run check
bun run bench list-targets
bun run bench list-agents
bun run bench doctor
```

Build the common Pi image through any retained profile:

```bash
bun run bench docker-build --agent pi-openai-gpt-5.4-mini-medium-subscription
```

Building and inspecting the image does not perform model inference.

## OpenAI subscription authentication

Store the benchmark-specific Pi login outside the repository:

```bash
mkdir -p "$HOME/.ai-task-bench/pi-openai-codex"
PI_CODING_AGENT_DIR="$HOME/.ai-task-bench/pi-openai-codex" \
  bun "$(command -v pi)"
```

Inside Pi, run `/login`, select `ChatGPT Plus/Pro (Codex)`, complete the browser flow, and exit. The benchmark mounts this directory at `/agent-home/.pi/agent` only for profiles using provider `openai-codex`.

Never commit, print, inspect, copy into evidence, or publish its authentication file.

## API-key configuration

Copy the versioned placeholder file and set keys only in the ignored local file or host environment:

```bash
cp .env.example .env
```

`.env.example` contains empty `MINIMAX_API_KEY` and `OPENCODE_API_KEY` placeholders plus `PI_TELEMETRY=0`. `OPENCODE_API_KEY` is optional while the retained free profiles continue using public access. Never include literal keys in an agent profile, run archive, evidence directory, or report.

## Reference executions

Use three independent runs per target for reported comparisons unless the study protocol specifies another repetition count.

```bash
bun run bench run CC3001/t01 \
  --agent pi-openai-gpt-5.4-mini-medium-subscription \
  --runs 3

bun run bench run CC3001/t01 \
  --agent pi-zen-deepseek-v4-flash-free-xhigh \
  --runs 3

bun run bench run CC3001/t01 \
  --agent pi-zen-mimo-v2.5-free-high \
  --runs 3

bun run bench run CC3001/t01 \
  --agent pi-minimax-m3-high-api \
  --runs 3
```

A one-run execution is a smoke test, not a stability estimate.

## Experimental controls

Do not compare conditions that differ in target commit, public material, execution environment, prompt addon, tool policy, timeout, grading rubric, run count, harness, Pi version, or target modality without reporting those differences.

Report together:

- agent ID;
- harness and provider;
- exact model ID;
- requested Pi thinking level and known provider mapping;
- declared image support and target modality;
- Pi version and Docker image identity;
- prompt-addon SHA-256;
- target commit and repetition count.

Free OpenCode endpoints can change availability, routing, quotas, context limits, or backend revisions independently of this repository. Treat DeepSeek and MiMo results as conditions tied to the recorded execution date and Pi image.

## Evidence and normalized sessions

Each solver Run preserves immutable Input, final Output, prompt provenance, agent configuration, the solver addon and its hash, stderr, compact normalized session artifacts, hashes, diffs, metrics, and Review material. Raw Pi event streams and agent homes are transient working data: they exist only until compact-session publication succeeds. Rubric generation and judging preserve their own Spanish addon, hash, prompt, adapter configuration, and compact session artifacts where Pi runs in JSON mode.

The relevant files are:

```text
03-agent-config/
  agent-prompt.md
  adapter-config.json
05-evidence/
  agent-config.json
  agent-prompt.md
  prompt-metadata.json
  agent.stderr.log
07-session/
  session.compact.json
  session.html
  metrics.json
```

During execution, Pi `--mode json` output is written once under `05-evidence/.transient-pi/events.jsonl`. The normalizer reads it incrementally, collapses streaming deltas, truncates oversized tool outputs with byte counts, and publishes schema-versioned `session.compact.json` plus `metrics.json`. It generates `session.html` only when the compact artifact and rendered HTML remain below `BENCH_SESSION_HTML_MAX_BYTES` (5 MiB by default). Tool results retain at most `BENCH_SESSION_TOOL_RESULT_MAX_BYTES` bytes each (64 KiB by default).

After all retained artifacts are written successfully, the transient JSONL and `agent-home` are deleted. If compaction fails, `.transient-pi/` remains with `compaction-error.json`; the Run fails with a precise compaction error so the raw source can be inspected or retried. No implementation silently substitutes an empty session.

`session.compact.json` preserves user messages, safe attachment metadata, assistant text, provider-returned thinking, tool calls and arguments, truncated tool results with original/retained byte metadata, errors, retries, per-turn usage, aggregate tokens, reasoning tokens, cache usage, costs, and normalization diagnostics. It never invents thinking that Pi did not expose and never embeds image base64 payloads. `session.html` provides a standalone timeline with thinking/tool toggles; `metrics.json` is the aggregate UI/analysis view and records whether HTML was generated or skipped by the size limit.

Pi `0.80.2` accepts `session.compact.json` as `--export` input but reads it as a native session with zero entries, so the resulting HTML is only an empty viewer shell. The compact schema is not a valid Pi export source. The benchmark therefore uses its own bounded renderer instead of translating compact data back into a fragile Pi-native JSONL stream.

A static site must consume `session.compact.json` or `session.html`, never raw JSONL. Raw event logs may be archived outside the repository only under an explicit release policy that records their content hash, storage location, access controls, and retention period.

Migrate historical Runs with:

```bash
# Parse all historical raw logs and report expected savings without writing.
bun run compact:sessions --dry-run

# Compact one Run or one raw JSONL, retaining the raw source.
bun run compact:sessions --run <run-directory-or-jsonl>

# Delete raw logs and agent homes only after each compact publication succeeds.
bun run compact:sessions --delete-raw
```

The migrator prefers `agent.events.jsonl`, then `stdout.jsonl`, then legacy `agent.stdout.log`; duplicate raw copies in the same invocation are grouped and deleted together only with `--delete-raw`.

For an experiment release, preserve:

- the exact repository commit;
- the included publishable `runs/` directories, excluding transient raw logs, agent homes, and caches;
- the agent JSON definitions used by the study;
- the three versioned Spanish prompt addons;
- approved rubrics and approvals;
- host and tool versions;
- Docker image ID or digest;
- a table mapping target, condition, repetition, run ID, completion status, and score.

Never publish authentication files or tokens.

## Native Pi sessions

The benchmark retains `--no-session`. Pi `0.80.2` can write native sessions to a custom directory, but preserving them has not been shown to be behavior-neutral without a real model execution. The retained compact benchmark session is the canonical publishable source; the raw event stream is only a transient normalization input.

Do not use `--continue`, `--resume`, shared `--session-id` values, or any other continuity mechanism between runs. A native Pi session may be added later only if it can be isolated per run, kept outside shared authentication storage, tested without provider inference, and shown not to change observable agent behavior.

## Current reproducibility limits

Remote-model execution is not bit-for-bit deterministic. Provider-side sampling, backend updates, routing, rate limits, endpoint availability, and subscription behavior remain outside the repository.

The Pi package is pinned to `0.80.2`, but the Docker base image tag and the Bun installer remain mutable. Retain the original Docker image digest for the strongest available reproduction.

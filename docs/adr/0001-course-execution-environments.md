# 0001: Course execution environments

## Status

Accepted.

## Context

Benchmark Tasks come from courses with different language runtimes, native libraries, toolchains, and operating-system expectations. A universal image would make every Solver see unrelated tools and would couple all Tasks to one large mutable dependency set. A separately maintained image for every Task would duplicate most dependencies and create avoidable drift.

Runs must remain independent experimental observations. State created by one Solver must not be visible to another Run.

## Decision

Use one Execution Environment per course when the course is technically homogeneous. Every Run starts a new disposable Docker container from the selected immutable image; the container is removed when execution finishes, while Run Input, Output, Evidence, and metadata remain on the host.

Course defaults are declared in `tasks/environments.json`. A Task Manifest may set `environmentId` to override its course default. The CLI `--environment` option remains an explicit experimental override and takes precedence over both.

The initial environment families are:

- CC3001: Python managed with `uv`;
- CC3301: Debian 12 with the native C and RISC-V toolchains;
- CC3501: Debian 12, Python managed with `uv`, Xvfb, and Mesa software rendering;
- CC4101: Debian 12, Racket, and a pinned `play` package revision;
- CC4102: Debian 12 with C, C++, Java, Python, and plotting tools;
- CC4302: Debian 12 with the user-space concurrency toolchain;
- CC4303: Debian 12 with Python, DNS/networking tools, and isolated network administration for socket and netem exercises.

Execution limits and container options belong to the Environment Profile rather than the Agent configuration. The effective Environment ID is persisted in `run.json`, and the complete Environment Profile is copied into the Run agent-config directory.

## Alternatives considered

### One universal image

Rejected because it exposes unrelated capabilities, increases image size, and makes a dependency change for one course alter every experimental condition.

### One image per Task

Rejected as the default because it duplicates course-level dependencies and makes version drift harder to control. Task-level images remain available when a Task genuinely requires a distinct architecture or runtime.

### Reuse one live container

Rejected because filesystem, process, cache, package, and home-directory state could leak between Runs.

## Consequences

- Images must be built and smoke-tested before an experimental batch is frozen.
- Image tags used during development should be replaced by recorded image digests for published experimental results.
- Updating a dependency, base image, Pi version, or runtime profile creates a new experimental condition.
- Performance-sensitive Tasks still require controlled host scheduling; a Docker CPU quota alone does not guarantee dedicated cores.
- Provider network access currently requires container networking. Restricting Solver egress requires a separate authenticated proxy or allowlist design.

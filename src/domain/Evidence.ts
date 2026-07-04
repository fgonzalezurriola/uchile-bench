/**
 * Evidence domain type.
 * File names used in the 05-evidence directory.
 */
export const EvidenceFile = {
  TREE_BEFORE: "tree-before.txt",
  TREE_AFTER: "tree-after.txt",
  FILES_BEFORE: "files-before.json",
  FILES_AFTER: "files-after.json",
  DIFF_PATCH: "diff.patch",
  FILES_CREATED: "files-created.txt",
  FILES_MODIFIED: "files-modified.txt",
  PROMPT: "prompt.txt",
  AGENT_CONFIG: "agent-config.json",
  AGENT_PROMPT: "agent-prompt.md",
  PROMPT_METADATA: "prompt-metadata.json",
  AGENT_STDOUT: "agent.stdout.log",
  AGENT_STDERR: "agent.stderr.log",
  AGENT_EVENTS: "agent.events.jsonl",
} as const

export type EvidenceFileName = (typeof EvidenceFile)[keyof typeof EvidenceFile]

/**
 * Session file names used in the 07-session directory.
 */
export const SessionFile = {
  SESSION_COMPACT_JSON: "session.compact.json",
  SESSION_HTML: "session.html",
  METRICS_JSON: "metrics.json",
} as const

/** Raw Pi streams exist only until compact session publication succeeds. */
export const TransientSessionFile = {
  DIRECTORY: ".transient-pi",
  EVENTS_JSONL: "events.jsonl",
  COMPACTION_ERROR: "compaction-error.json",
} as const

export type SessionFileName = (typeof SessionFile)[keyof typeof SessionFile]

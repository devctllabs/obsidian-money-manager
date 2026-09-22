---
status: accepted
date: 2026-09-13
---

# Keep the companion CLI read-only and share validation

The Node.js companion CLI is a separate executable that reuses Money Manager's pure Markdown
parsing, reference validation, and snapshot construction. Its `validate` and `new-id` commands never
write Money Workspace files; the external agent skill owns confirmed edits, so the plugin, CLI, and
skill do not become competing mutation authorities.

## Considered options

- **A write-capable financial CLI** would centralize serialization but make command invocation alone
  sufficient authority for durable financial changes.
- **An Obsidian-hosted agent API** would couple authoring to a running desktop host and violate the
  mobile-compatible, local-only runtime boundary.
- **A duplicate CLI validator** would let the plugin and external workflow disagree about the same
  canonical documents.

## Consequences

The CLI has its own Node 22+ entrypoint and filesystem adapter, while the Obsidian entrypoint never
imports Node modules. Its command names, JSON result shape, diagnostic fields, and exit codes are
public compatibility contracts. Managed-path symbolic links are rejected rather than followed.


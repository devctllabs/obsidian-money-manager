---
status: accepted
date: 2026-09-12
---

# Keep the plugin local-only and mobile-compatible

Money Manager reads and writes through public Obsidian APIs, keeping Node,
Electron, subprocess, and direct filesystem APIs out of the runtime path. This
keeps the runtime compatible with both supported hosts and limits its trusted
surface, implementing the product boundary in
[PDR-0004](../product/decisions/0004-keep-personal-finance-local-and-mobile.md).

## Considered options

- **Desktop-only filesystem integration** would simplify unrestricted file
  access but cannot support both hosts required by PDR-0004.

## Consequences

Runtime dependencies must respect the same host API restrictions. Revising
these technical restrictions requires a superseding ADR. Any future network,
bank, AI-runtime, or desktop-only plugin capability must first revisit PDR-0004;
a setting or feature flag does not change the accepted product boundary. The
optional external agent and its Node CLI stay outside this runtime as recorded
in [ADR-0006](./0006-keep-the-companion-cli-read-only-and-share-validation.md).

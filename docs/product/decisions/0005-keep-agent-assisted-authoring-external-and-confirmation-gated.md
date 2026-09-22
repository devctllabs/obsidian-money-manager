# Keep agent-assisted authoring external and confirmation-gated

Status: Accepted
Date: 2026-09-13

Money Manager supports optional agent-assisted authoring outside the Obsidian plugin, but every
financial batch requires an explicit preview and confirmation before files change. This preserves
the plugin's local, offline, no-AI runtime while letting a user dictate financial facts without
giving an agent silent or ambient authority over the Money Workspace.

## Considered Options

- **Embed AI in the plugin** would add network, credential, consent, provider, and mobile-runtime
  concerns to the trusted financial interface.
- **Let the companion CLI write financial records directly** would hide intent resolution and
  confirmation policy behind an imperative command and create a second mutation authority.
- **Allow unconfirmed agent writes** would make conversational interpretation sufficient authority
  for durable financial changes.

## Consequences

The external skill must validate the complete Money Workspace, resolve material ambiguities,
preview the whole proposed batch, wait for explicit confirmation, preserve unrelated Markdown, and
validate again after writing. The plugin has no dependency on the agent or CLI. Installation of the
external tooling may use the network, but validation and confirmed workspace edits remain local.


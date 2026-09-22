# Keep personal finance local and mobile

Status: Accepted
Date: 2026-09-12

Money Manager supports personal financial tracking locally on desktop and mobile
as first-class environments, with no account, server, network client, telemetry,
advertising, bank integration, remote rate feed, secret storage, or AI runtime.
This keeps a sensitive personal ledger useful offline and limits the trusted
runtime surface.

## Considered Options

- **Optional online rates or bank sync** would still introduce credentials,
  consent, disclosure, retries, provider semantics, and failure states to the
  plugin that owns the user's local financial record.
- **A desktop-only product** would split the workflow across devices without
  enabling any accepted V1 behavior.

## Consequences

No plugin-runtime behavior may depend on network availability or hide durable
financial state outside the vault. Any future network, bank, AI-runtime, or
desktop-only plugin capability requires a superseding PDR rather than an
ordinary setting or feature flag. Optional external agent-assisted authoring is
not a plugin dependency; its separate confirmation boundary is recorded in
[PDR-0005](./0005-keep-agent-assisted-authoring-external-and-confirmation-gated.md).

[ADR-0004](../../adr/0004-keep-the-plugin-local-only-and-mobile-compatible.md)
records the host API and runtime restrictions implementing this boundary.

---
status: accepted
date: 2026-09-12
---

# Keep core contracts host-agnostic

Money, Entry, Account, Category, path, parsing, Balance, rate, and report rules
remain pure TypeScript. Application workflows depend on capability-sized
document and mutation ports; Obsidian owns adapters, lifecycle, and composition,
while React receives serializable view models and callbacks. This boundary makes
financial calculations and partial-write behavior deterministic without
recreating the Obsidian host in every test.

## Considered options

- **Pass `App` or `Vault` through domain and feature code** would reduce small
  interfaces initially but couple calculations, forms, and tests to host-wide
  mutable objects.
- **Put behavior directly in the Plugin, ItemView, and React components** would
  make lifecycle and rendering the only way to exercise money rules.
- **Extract multiple packages immediately** would add publication and workspace
  management before a second executable or consumer exists.

## Consequences

Host types stop at the adapter boundary, but V1 remains one package. Ports stay
specific to current workflows rather than becoming generic repositories or
managers. ItemView, Modal, and Settings shells own React roots and cleanup;
presentational surfaces remain renderable in Storybook without constructing an
Obsidian `App`.

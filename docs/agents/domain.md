# Domain Docs

## Before exploring

This repo uses a single-context layout:

- Read `CONTEXT.md` at the repo root.
- Read ADRs in `docs/adr/` relevant to the work.
- Read PDRs in `docs/product/decisions/` relevant to the work.

If these documents are absent, proceed silently. Domain modeling creates the
glossary and ADRs lazily; product modeling creates PDRs when qualifying product
decisions are accepted.

## Use domain vocabulary

Use terms defined in `CONTEXT.md` when naming domain concepts in issues,
proposals, hypotheses, and tests. Respect the glossary's avoided synonyms.

If a needed concept is missing, reconsider the terminology or note the gap
for domain modeling.

## Surface decision conflicts

PDRs explain accepted product choices; ADRs explain technical choices. If a
proposal contradicts either, explicitly identify the record and explain why
the decision should be revisited.

Number ADRs and PDRs independently with four digits (`0001`, `0002`, ...).

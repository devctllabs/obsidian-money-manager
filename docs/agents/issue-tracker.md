# Issue tracker: Local Markdown

Issues and specs live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`.
- Spec: `.scratch/<feature-slug>/spec.md`.
- Implementation tickets: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`,
  numbered from `01`, one file per ticket.
- Record issue state as a `Status:` line near the top.
- Append comments and conversation history under `## Comments`.

## Publish to the issue tracker

Create the spec or individual ticket files at the paths above.
Create directories as needed.

## Fetch the relevant ticket

Read the referenced file. Resolve a ticket number within its feature directory.
If the number matches multiple features and context does not identify one,
ask which feature the user means.

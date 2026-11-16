# AGENTS.md

Instructions for AI coding agents live in one place: [CLAUDE.md](./CLAUDE.md).
Read it before changing anything. It covers the commands, the architecture,
the database safety rules and what "done" means.

Also useful:

- [docs/process/HANDOFF.md](./docs/process/HANDOFF.md): **start here if you are continuing the `next` branch.** The task queue, how to land work, and what not to touch
- [docs/AGENT_SAFETY.md](./docs/AGENT_SAFETY.md): what agents must never do, and what enforces each rule
- [docs/process/RISK_TIERS.md](./docs/process/RISK_TIERS.md): which changes need a person to review them
- [docs/process/INTEGRATION_BRANCH.md](./docs/process/INTEGRATION_BRANCH.md): how the `next` branch works
- [docs/spec/SHELF_FORMAT.md](./docs/spec/SHELF_FORMAT.md): the public shelf format

This file exists so tools that look for `AGENTS.md` find the same
instructions. Do not add guidance here; add it to `CLAUDE.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

#!/usr/bin/env bash
# One-command setup for a fresh checkout or git worktree (issue #274).
#
#   npm run setup
#
# 1. Installs exactly the locked dependencies (npm ci).
# 2. Installs the Chromium build that the locked Playwright version expects.
#    Skipped if it's already installed; the first run downloads it.
# 3. In a git worktree with no .env.local, links the main checkout's .env.local
#    (gitignored files aren't copied into worktrees).
# 4. Lists required env vars that are missing (names only, never values) and
#    warns if DATABASE_URL points at production.
#
# Set SKIP_BROWSER=1 to skip step 2 (for example when only running unit tests).
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

echo "==> Installing dependencies (npm ci)"
npm ci --no-audit --no-fund

if [[ "${SKIP_BROWSER:-}" == "1" ]]; then
  echo "==> Skipping Playwright browser (SKIP_BROWSER=1)"
else
  echo "==> Installing Playwright Chromium (no-op if already installed)"
  npx playwright install chromium
fi

if [[ ! -e .env.local ]]; then
  main_checkout="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
  if [[ "$main_checkout" != "$(pwd)" && -f "$main_checkout/.env.local" ]]; then
    ln -s "$main_checkout/.env.local" .env.local
    echo "==> Linked .env.local from the main checkout ($main_checkout)"
  else
    echo "==> No .env.local found. Create one (see CLAUDE.md, Environment Variables)."
  fi
fi

echo "==> Checking environment"
npx tsx scripts/check-env.ts

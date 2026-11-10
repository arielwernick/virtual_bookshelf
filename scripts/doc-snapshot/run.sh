#!/usr/bin/env bash
# Run a doc snapshot job from origin/main's code, without touching any
# checkout or worktree.
#
#   scripts/doc-snapshot/run.sh live-site [args...]
#   scripts/doc-snapshot/run.sh repo [args...]
#
# Or, from anywhere, always using the latest origin/main copy of this file:
#   git -C <repo> fetch -q origin && git -C <repo> show origin/main:scripts/doc-snapshot/run.sh | bash -s -- repo
#
# Env:
#   VB_REPO   repo checkout to read git data and node_modules from
#             (default: the main checkout that owns the current directory)
#   CODE_REF  ref to take the scripts from (default origin/main)
#   OUT_DIR   where to write results (default ~/.cache/vb-doc-snapshot/out/<date>)
set -euo pipefail

job="${1:?usage: run.sh live-site|repo [args...]}"
shift || true

if [[ -n "${VB_REPO:-}" ]]; then
  repo="$VB_REPO"
else
  common="$(git rev-parse --path-format=absolute --git-common-dir)"
  repo="$(dirname "$common")"
fi
code_ref="${CODE_REF:-origin/main}"
cache="$HOME/.cache/vb-doc-snapshot"
out="${OUT_DIR:-$cache/out/$(date +%F)}"
code="$cache/code"

git -C "$repo" fetch -q origin
commit="$(git -C "$repo" rev-parse --short origin/main)"

# Fresh copy of the snapshot scripts from the chosen ref.
rm -rf "$code"
mkdir -p "$code" "$out"
git -C "$repo" archive "$code_ref" scripts/doc-snapshot | tar -x -C "$code"
ln -s "$repo/node_modules" "$code/node_modules"

case "$job" in
  live-site)
    node "$code/scripts/doc-snapshot/live-site.mjs" --out "$out" --commit "$commit" "$@"
    ;;
  repo)
    (cd "$repo" && node "$code/scripts/doc-snapshot/repo.mjs" --no-fetch --ref origin/main --out "$out" "$@")
    ;;
  *)
    echo "unknown job: $job" >&2
    exit 2
    ;;
esac

echo "OUT_DIR=$out"
echo "COMMIT=$commit"

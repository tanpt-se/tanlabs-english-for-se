#!/usr/bin/env bash
# WP-02: prove Husky + lint-staged install and staged-only behavior.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ "${HUSKY:-}" == "0" ]]; then
  echo "HUSKY=0 is set; unset it for this verification." >&2
  exit 1
fi

echo "==> ensure husky install"
pnpm exec husky
hooks_path="$(git config --get core.hooksPath || true)"
if [[ "$hooks_path" != ".husky/_" ]]; then
  echo "expected core.hooksPath=.husky/_, got: ${hooks_path:-<empty>}" >&2
  exit 1
fi
test -x .husky/_/pre-commit
test -f .husky/pre-commit

PROBE_STAGED="WP02_HOOK_PROBE.md"
PROBE_UNSTAGED="WP02_UNSTAGED.md"
cleanup() {
  git reset HEAD -- "$PROBE_STAGED" >/dev/null 2>&1 || true
  rm -f "$PROBE_STAGED" "$PROBE_UNSTAGED"
}
trap cleanup EXIT

echo "# wp02 staged probe" >"$PROBE_STAGED"
printf 'unformatted   \n' >"$PROBE_UNSTAGED"
git add "$PROBE_STAGED"

echo "==> invoke husky pre-commit → lint-staged"
.husky/_/pre-commit

if ! git diff --cached --name-only | grep -qx "$PROBE_STAGED"; then
  echo "staged probe missing after lint-staged" >&2
  exit 1
fi
if git diff --name-only | grep -qx "$PROBE_UNSTAGED"; then
  echo "unstaged probe was unexpectedly modified" >&2
  exit 1
fi
# unstaged file must still exist and remain untouched enough to keep trailing spaces intent
if ! grep -q 'unformatted' "$PROBE_UNSTAGED"; then
  echo "unstaged probe disappeared" >&2
  exit 1
fi

echo "WP-02 hook verification PASSED"

#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Static HTML/CSS/JS site — no build dependencies required.
# Ensure Python is available for local previewing.
python3 --version > /dev/null 2>&1 && echo "Python available for http.server" || true

#!/bin/sh
set -eu

export CI=true

pnpm install --frozen-lockfile
pnpm --filter @freevibes/web dev --hostname 0.0.0.0

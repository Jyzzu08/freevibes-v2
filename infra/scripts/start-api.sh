#!/bin/sh
set -eu

export CI=true

pnpm install --frozen-lockfile
pnpm --filter @freevibes/api exec prisma generate
pnpm --filter @freevibes/api exec prisma migrate deploy
pnpm --filter @freevibes/api exec prisma db seed
pnpm --filter @freevibes/api start:dev

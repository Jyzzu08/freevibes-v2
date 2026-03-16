const { rmSync } = require('node:fs');
const { spawnSync } = require('node:child_process');

const distDir = process.env.NEXT_DIST_DIR || 'node_modules/.cache/next-build';

rmSync(distDir, { recursive: true, force: true });

const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const result = spawnSync(command, ['exec', 'next', 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_DIST_DIR: distDir,
  },
});

process.exit(result.status ?? 1);

#!/usr/bin/env node
// PostToolUse(Write|Edit|MultiEdit): auto-format with Prettier. Never blocks.
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

try {
  const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
  const file = String(input?.tool_input?.file_path ?? '');
  if (file && existsSync(file) && /\.(tsx?|jsx?|mjs|cjs|json|css|md|mdx|ya?ml)$/.test(file)) {
    spawnSync('pnpm', ['exec', 'prettier', '--write', '--ignore-unknown', '--log-level=silent', file], {
      cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
      timeout: 20000,
      stdio: 'ignore',
    });
  }
} catch {
  /* formatting is best-effort */
}
process.exit(0);

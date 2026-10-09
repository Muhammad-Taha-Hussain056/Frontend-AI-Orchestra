#!/usr/bin/env node
// SessionStart: prints project config + pinned versions so Claude never assumes a version.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const readJson = (p) => {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
};

const config = readJson(path.join(root, '.claude/orchestra.config.json'));
const dirs = [root, ...Object.values(config?.apps ?? {}).map((a) => path.join(root, a.path))];
const deps = {};
for (const d of dirs) {
  const pkg = readJson(path.join(d, 'package.json'));
  Object.assign(deps, pkg?.devDependencies, pkg?.dependencies);
}

const WATCH = ['next', 'react', 'typescript', '@tanstack/react-query', 'zod', 'react-hook-form', '@hookform/resolvers',
  'tailwindcss', 'zustand', '@reduxjs/toolkit', 'next-intl', 'date-fns', 'vitest', '@playwright/test'];
const lines = WATCH.filter((n) => deps[n]).map((n) => `  ${n}: ${deps[n]}`);

console.log('## Frontend Orchestra context');
if (config) {
  console.log(`scope=${config.scope}  pm=${config.packageManager}  apps=${Object.keys(config.apps).join(', ')}`);
  console.log(`toggles=${JSON.stringify(config.toggles)}  errorFormat=${config.backend?.errorFormat}`);
} else {
  console.log('WARNING: .claude/orchestra.config.json missing or invalid.');
}
console.log(lines.length ? 'Pinned versions (verify version-specific APIs against these):\n' + lines.join('\n')
  : 'No dependency versions found yet (new repo?). Pin versions at scaffold time.');
if (!existsSync(path.join(root, 'pnpm-workspace.yaml'))) console.log('Note: pnpm-workspace.yaml not found; repo may not be scaffolded yet.');
process.exit(0);

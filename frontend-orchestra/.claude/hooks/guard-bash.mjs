#!/usr/bin/env node
// PreToolUse(Bash): hard-blocks (exit 2) a short list of violations.
//  1. non-pnpm package managers   2. reading real .env files   3. bypassing git hooks
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const cmd = String(input?.tool_input?.command ?? '');
const block = (msg) => {
  console.error(`BLOCKED by orchestra hook: ${msg}`);
  process.exit(2);
};

const segments = cmd
  .split(/&&|\|\||;|\|/)
  .map((s) => s.trim().replace(/^(\w+=\S+\s+)+/, '')); // drop leading ENV=1 assignments

for (const seg of segments) {
  if (/^(npm|npx|yarn|bun|bunx)(\s|$)/.test(seg)) {
    block('this repo uses pnpm only. Use `pnpm add`, `pnpm dlx`, `pnpm --filter <pkg> <script>` or `pnpm turbo run <task>`.');
  }
  if (/\b(cat|less|more|head|tail|grep|rg|source|bat)\b[^|;&]*\.env(\.[\w.-]+)?(\s|$)/.test(seg) &&
      !/\.env\.(example|sample)\b/.test(seg)) {
    block('real .env files are human-managed secrets. Read `.env.example` instead.');
  }
}

if (/\bgit\s+(commit|push)\b[^|;&]*--no-verify\b/.test(cmd)) {
  block('--no-verify bypasses Husky (lint-staged, commitlint, pre-push checks). Fix the underlying failure instead.');
}
process.exit(0);

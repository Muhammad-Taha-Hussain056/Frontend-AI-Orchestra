#!/usr/bin/env node
// PreToolUse(Write|Edit|MultiEdit): hard-blocks (exit 2) secrets and cross-feature imports.
import { readFileSync } from 'node:fs';
import path from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const ti = input?.tool_input ?? {};
const filePath = String(ti.file_path ?? '').replace(/\\/g, '/');
const text = [ti.content, ti.new_string, ...(Array.isArray(ti.edits) ? ti.edits.map((e) => e?.new_string) : [])]
  .filter((v) => typeof v === 'string')
  .join('\n');

const block = (msg) => {
  console.error(`BLOCKED by orchestra hook: ${msg}`);
  process.exit(2);
};

// ---- 1. Secrets -------------------------------------------------------------
const base = path.posix.basename(filePath);
if (/^\.env(\..+)?$/.test(base) && !/\.(example|sample)$/.test(base)) {
  block(`${base} holds real secrets and is human-managed. Edit .env.example (names only, no values) instead.`);
}

const SECRET_PATTERNS = [
  [/AKIA[0-9A-Z]{16}/, 'AWS access key id'],
  [/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/, 'private key'],
  [/sk_live_[0-9a-zA-Z]{16,}/, 'Stripe live secret key'],
  [/gh[pousr]_[0-9A-Za-z]{36,}/, 'GitHub token'],
  [/xox[baprs]-[0-9A-Za-z-]{10,}/, 'Slack token'],
];
for (const [re, label] of SECRET_PATTERNS) {
  if (re.test(text)) block(`content looks like a ${label}. Use environment variables validated in src/lib/env.ts.`);
}
const isTestLike = /\.(test|spec|stories)\.[tj]sx?$/.test(filePath) || /\/(__tests__|__mocks__|fixtures)\//.test(filePath);
if (!isTestLike) {
  const generic = /(api[_-]?key|secret|token|password)\s*[:=]\s*['"]([^'"\s]{20,})['"]/i.exec(text);
  if (generic && !/process\.env|import\.meta\.env|example|placeholder|xxxx/i.test(generic[0])) {
    block('hard-coded credential-like value detected. Read it from validated environment variables instead.');
  }
}

// ---- 2. Cross-feature imports ----------------------------------------------
const own = /(?:^|\/)features\/([^/]+)\//.exec(filePath)?.[1];
if (own && /\.[mc]?[tj]sx?$/.test(filePath)) {
  const importRe = /(?:from\s+|import\s*\(\s*|require\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;
  let m;
  while ((m = importRe.exec(text))) {
    let spec = m[1];
    if (spec.startsWith('.')) spec = path.posix.normalize(path.posix.join(path.posix.dirname(filePath), spec));
    const target = /(?:^|\/)features\/([^/'"]+)/.exec(spec)?.[1];
    if (target && target !== own) {
      block(
        `feature "${own}" imports from feature "${target}" ("${m[1]}"). Features never import features. ` +
          'Compose them in the route (src/app), or promote the shared piece to src/components, src/lib or a package. See skill arch-feature-boundaries.'
      );
    }
  }
}
process.exit(0);

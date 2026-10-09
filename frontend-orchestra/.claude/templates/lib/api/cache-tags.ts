import 'server-only';
import { revalidateTag } from 'next/cache';

// Central map: which mutations invalidate which PUBLIC cached data (Next data cache).
// Per-user data is never cached in Next, so it needs no entry. revalidateTag's signature varies by Next version:
// see skill next-rendering-modes/references/by-version.md before changing this call.
const RULES: Array<{ methods: string[]; match: RegExp; tags: string[] }> = [
  // { methods: ['POST', 'PUT', 'PATCH', 'DELETE'], match: /^products(\/|$)/, tags: ['products'] },
];

export async function applyCacheTags(method: string, path: string) {
  for (const r of RULES) if (r.methods.includes(method) && r.match.test(path)) r.tags.forEach((t) => revalidateTag(t));
}

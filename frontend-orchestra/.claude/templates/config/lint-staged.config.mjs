// Place one in each workspace (apps/web, packages/ui, ...) and a root one for repo-level files.
export default {
  '*.{ts,tsx,js,jsx,mjs}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '*.{json,md,mdx,css,yml,yaml}': ['prettier --write'],
};

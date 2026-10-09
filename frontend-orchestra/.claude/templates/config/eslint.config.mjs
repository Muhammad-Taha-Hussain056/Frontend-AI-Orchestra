// packages/config-eslint/next.mjs (shape). Plugin APIs vary by version: check the pinned versions' docs.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import query from '@tanstack/eslint-plugin-query';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const RAW_COLOR = "Literal[value=/\\b(bg|text|border|ring|fill|stroke|from|to|via)-(white|black|(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3})\\b/]";

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  ...query.configs['flat/recommended'],
  { languageOptions: { parserOptions: { projectService: true } } },
  {
    plugins: { boundaries, 'simple-import-sort': simpleImportSort },
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'feature', pattern: 'src/features/*', capture: ['featureName'] },
        { type: 'shared', pattern: ['src/components/**', 'src/lib/**'] },
      ],
    },
    rules: {
      'boundaries/element-types': ['error', { default: 'disallow', rules: [
        { from: 'app', allow: ['feature', 'shared'] },
        { from: 'feature', allow: ['shared', ['feature', { featureName: '${from.featureName}' }]] },   // syntax varies by plugin version
        { from: 'shared', allow: ['shared'] },
      ] }],
      'simple-import-sort/imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description', 'ts-ignore': true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-restricted-imports': ['error', { paths: [
        { name: 'next/router', message: 'Use next/navigation (App Router).' },
        { name: 'axios', message: 'Use apiFetch (skill data-bff-proxy).' },
        { name: 'moment', message: 'Use date-fns helpers (skill x-dates).' },
      ], patterns: [{ group: ['@radix-ui/*'], message: 'Radix is imported only inside packages/ui.' }] }],
      'no-restricted-syntax': ['error',
        { selector: RAW_COLOR, message: 'Use semantic tokens (skill ui-layers-tokens).' },
        { selector: "MemberExpression[object.name='process'][property.name='env']", message: 'Read env through src/lib/env.ts.' },
      ],
    },
  },
  // Allowed exceptions
  { files: ['src/lib/env.ts', 'src/middleware.ts', 'src/lib/auth/cookies.ts', 'next.config.*', '**/*.config.*'], rules: { 'no-restricted-syntax': 'off' } },
  { files: ['src/app/**/{page,layout,loading,error,not-found,route,default,template}.tsx', 'src/app/**/route.ts', '**/*.stories.tsx', '**/*.config.*'], rules: { 'import/no-default-export': 'off' } },
];

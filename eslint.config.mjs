// ESLint 9 flat config (VULN-018 migration).
// Same ruleset as before (next/core-web-vitals), loaded via FlatCompat
// because eslint-config-next still ships in eslintrc format.
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Global ignores (flat config has no .eslintignore).
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'coverage/**',
      'next-env.d.ts',
      // Standalone prototype folders with their own package.json — not part of the app build.
      'homly-search-flow/**',
      'homly-search-flow222/**',
      // Stray third-party assets (VULN-038) — minified vendor bundles, not our code.
      'HambarcumMC/**',
      'VectorStock/**',
      // Generated / infra
      'prisma/migrations/**',
      'docker/**',
      'public/**',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
];

export default eslintConfig;

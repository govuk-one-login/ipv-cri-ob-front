import { defineConfig } from 'oxlint'

import perfectionist from 'eslint-plugin-perfectionist'

const perfectionistWarnRules = Object.fromEntries(
  Object.keys(perfectionist.rules ?? {})
    .filter((k) => k.startsWith('sort-'))
    .map((k) => [`perfectionist/${k}`, 'warn'])
)

export default defineConfig({
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
    '.features-gen',
    'playwright-report',
    'test/browser/playwright-report-mobile',
    'coverage'
  ],
  plugins: ['typescript', 'unicorn', 'oxc', 'import', 'promise', 'node'],
  jsPlugins: [{ name: 'perfectionist', specifier: 'eslint-plugin-perfectionist' }],
  categories: {
    correctness: 'error'
  },
  options: {
    typeAware: true,
    typeCheck: true
  },
  rules: {
    ...perfectionistWarnRules,
    'typescript/consistent-type-imports': ['error', { fixStyle: 'separate-type-imports' }],
    'typescript/no-explicit-any': 'error',
    'typescript/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'typescript/no-misused-promises': 'error',
    'promise/no-callback-in-promise': ['error', { exceptions: ['next'] }],
    'typescript/no-floating-promises': 'error',
    'typescript/prefer-nullish-coalescing': 'off',
    'no-console': 'error',
    'perfectionist/sort-imports': [
      'warn',
      {
        groups: [
          [
            'type-builtin',
            'type-external',
            'type-internal',
            'type-parent',
            'type-sibling',
            'type-index'
          ],
          [
            'named-builtin',
            'named-external',
            'named-internal',
            'named-parent',
            'named-sibling',
            'named-index'
          ],
          [
            'default-builtin',
            'default-external',
            'default-internal',
            'default-parent',
            'default-sibling',
            'default-index'
          ],
          [
            'wildcard-builtin',
            'wildcard-external',
            'wildcard-internal',
            'wildcard-parent',
            'wildcard-sibling',
            'wildcard-index'
          ],
          'side-effect',
          'unknown'
        ],
        newlinesBetween: 1,
        type: 'natural'
      }
    ],
    'perfectionist/sort-objects': 'off'
  },
  overrides: [
    {
      files: ['src/index.ts'],
      rules: {
        'no-console': 'off',
        'perfectionist/sort-imports': 'off'
      }
    },
    {
      files: ['test/**/*'],
      rules: {
        'no-console': 'off',
        'no-empty-pattern': 'off'
      }
    },
    {
      files: ['src/utils/dev-tooling/**/*'],
      rules: {
        'typescript/no-misused-promises': 'off'
      }
    }
  ]
})

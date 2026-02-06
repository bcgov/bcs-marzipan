// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import json from '@eslint/json';

/**
 * Creates a type-checked ESLint configuration for TypeScript files.
 * Uses layered config pattern: spreads base configs, then adds languageOptions separately.
 *
 * @param {string[]} files - Glob patterns for files to match
 * @param {string[]} projects - Paths to tsconfig.json files
 * @param {import('eslint').Linter.LanguageOptions} [languageOptions] - Language options to apply
 */
function typeCheckedConfig(files, projects, languageOptions = {}) {
  return [
    // Apply base type-checked configs with file scope
    ...tseslint.configs.recommendedTypeChecked.map((config) => ({
      ...config,
      files,
    })),
    // Add languageOptions in separate config (ESLint merges configs for same files)
    {
      files,
      languageOptions: {
        ...languageOptions,
        parserOptions: {
          ...languageOptions.parserOptions,
          project: projects,
          tsconfigRootDir: import.meta.dirname,
        },
      },
    },
  ];
}

/** @type {Partial<import('eslint').Linter.RulesRecord>} */
const nestjsSharedRules = {
  // NestJS uses decorators and dynamic patterns that produce 'any' types by design
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-floating-promises': 'warn',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/no-misused-promises': 'off',
  'prettier/prettier': 'error',
};

export default defineConfig(
  // ============================================
  // Global Ignores
  // ============================================
  {
    ignores: [
      'eslint.config.mjs',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/tsconfig*.json',
      '.local/**',
      '**/*.md',
      'scripts/**',
      'packages/*/scripts/**',
      'package-lock.json',
      '**/migrations/meta/**',
    ],
  },

  // ============================================
  // JSON Linting
  // ============================================
  {
    files: ['**/*.json'],
    plugins: { json },
    language: 'json/json',
    rules: {
      'json/no-duplicate-keys': 'error',
      'json/no-empty-keys': 'error',
      'json/no-unsafe-values': 'error',
    },
  },

  // ============================================
  // Base JavaScript/TypeScript Rules
  // ============================================
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.ts', '**/*.tsx'],
    ...eslint.configs.recommended,
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
  })),

  // ============================================
  // Calendar Service (NestJS) - Source Files
  // ============================================
  ...typeCheckedConfig(
    ['calendar-service/src/**/*.ts'],
    ['./calendar-service/tsconfig.json'],
    { globals: globals.node, sourceType: 'commonjs' }
  ),
  {
    files: ['calendar-service/src/**/*.ts'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      ...nestjsSharedRules,
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },

  // ============================================
  // Calendar Service (NestJS) - Test Files
  // ============================================
  ...typeCheckedConfig(
    ['calendar-service/test/**/*.ts'],
    ['./calendar-service/tsconfig.test.json'],
    { globals: { ...globals.node, ...globals.jest }, sourceType: 'commonjs' }
  ),
  {
    files: ['calendar-service/test/**/*.ts'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      ...nestjsSharedRules,
      // Supertest + NestJS getHttpServer() has type inference limitations safe in test context
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },

  // ============================================
  // Calendar UI (React/Vite)
  // ============================================
  ...typeCheckedConfig(
    ['calendar-ui/**/*.ts', 'calendar-ui/**/*.tsx'],
    ['./calendar-ui/tsconfig.json'],
    {
      globals: { ...globals.browser, ...globals.es2021 },
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    }
  ),
  {
    files: ['calendar-ui/**/*.ts', 'calendar-ui/**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React rules
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      // Disable redundant type constituents rule due to issues with shared package types
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      // TODO: Re-enable these rules after fixing `any` type issues in calendar-ui
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'prettier/prettier': 'error',
    },
  },

  // ============================================
  // Shared Packages (database, shared)
  // ============================================
  ...typeCheckedConfig(
    ['packages/database/**/*.ts'],
    ['./packages/database/tsconfig.json'],
    { globals: globals.node }
  ),
  ...typeCheckedConfig(
    ['packages/shared/**/*.ts'],
    ['./packages/shared/tsconfig.json'],
    { globals: globals.node }
  ),

  // ============================================
  // Prettier (must be last to override formatting rules)
  // ============================================
  {
    ...eslintPluginPrettierRecommended,
    files: [
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
      '**/*.ts',
      '**/*.tsx',
      '**/*.json',
    ],
  }
);

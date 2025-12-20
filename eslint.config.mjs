// @ts-check

import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import json from '@eslint/json';

export default [
  // Global ignores
  {
    ignores: [
      'eslint.config.mjs',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.ts',
      '**/tsconfig*.json', // TypeScript config files
      '.local/**',
      '**/*.md',
      'scripts/**',
      'package-lock.json', // Generated file - too large and changes frequently
      '**/migrations/meta/**', // Generated migration metadata
    ],
  },

  // JSON linting configuration
  {
    plugins: {
      json,
    },
  },
  {
    files: ['**/*.json'],
    language: 'json/json',
    rules: {
      'json/no-duplicate-keys': 'error',
      'json/no-empty-keys': 'error',
      'json/no-unsafe-values': 'error',
      'json/sort-keys': 'off', // Let Prettier handle sorting
    },
  },

  // Base recommended configs
  {
    ...eslint.configs.recommended,
    files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.ts', '**/*.tsx'],
  },
  // Restrict to TypeScript files only
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
  })),

  // Calendar Service (NestJS) specific config - adopting Nest.js defaults
  // Apply type-checked configs for calendar-service source files
  ...tseslint.configs.recommendedTypeChecked.map((config) => {
    const baseConfig = config;
    // @ts-expect-error - languageOptions may exist on config but TypeScript doesn't know
    const existingLanguageOptions = baseConfig.languageOptions || {};
    return {
      ...baseConfig,
      files: ['calendar-service/src/**/*.ts'],
      languageOptions: {
        ...existingLanguageOptions,
        globals: {
          ...globals.node,
        },
        sourceType: 'commonjs',
        parserOptions: {
          project: ['./calendar-service/tsconfig.json'],
          tsconfigRootDir: import.meta.dirname,
        },
      },
    };
  }),
  // Apply type-checked configs for calendar-service test files
  ...tseslint.configs.recommendedTypeChecked.map((config) => {
    const baseConfig = config;
    // @ts-expect-error - languageOptions may exist on config but TypeScript doesn't know
    const existingLanguageOptions = baseConfig.languageOptions || {};
    return {
      ...baseConfig,
      files: ['calendar-service/test/**/*.ts'],
      languageOptions: {
        ...existingLanguageOptions,
        globals: {
          ...globals.node,
          ...globals.jest,
        },
        sourceType: 'commonjs',
        parserOptions: {
          project: ['./calendar-service/tsconfig.test.json'],
          tsconfigRootDir: import.meta.dirname,
        },
      },
    };
  }),
  {
    files: ['calendar-service/test/**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Disable no-unsafe-argument for test files - supertest + NestJS getHttpServer()
      // has known type inference limitations that are safe in test context
      '@typescript-eslint/no-unsafe-argument': 'off',
      // Nest.js default rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      // Disable unsafe rules for Nest.js - ExecutionContext.getRequest() returns 'any' by design
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },
  {
    files: ['calendar-service/src/**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // Nest.js default rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      // Disable unsafe rules for Nest.js - ExecutionContext.getRequest() returns 'any' by design
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      '@typescript-eslint/no-misused-promises': 'off',
    },
  },

  // Calendar UI (React) specific config
  // Apply type-checked configs for calendar-ui
  ...tseslint.configs.recommendedTypeChecked.map((config) => {
    const baseConfig = config;
    // @ts-expect-error - languageOptions may exist on config but TypeScript doesn't know
    const existingLanguageOptions = baseConfig.languageOptions || {};
    return {
      ...baseConfig,
      files: ['calendar-ui/**/*.ts', 'calendar-ui/**/*.tsx'],
      languageOptions: {
        ...existingLanguageOptions,
        globals: {
          ...globals.browser,
          ...globals.es2021,
        },
        sourceType: 'module',
        parserOptions: {
          project: ['./calendar-ui/tsconfig.json'],
          tsconfigRootDir: import.meta.dirname,
          ecmaFeatures: {
            jsx: true,
          },
        },
      },
    };
  }),
  {
    files: ['calendar-ui/**/*.ts', 'calendar-ui/**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React-specific rules
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react/react-in-jsx-scope': 'off', // Using TypeScript for JSX
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // TypeScript rules for React files
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      // TODO: TEMPORARY RULES - Remove these rules after fixing `any` type issues
      // These rules are temporarily disabled to silence linting errors related to `any` types
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      // END TEMPORARY RULES - Remove the above
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },

  // Packages (database, shared) - type-checked configs
  // Apply type-checked configs for packages/database
  ...tseslint.configs.recommendedTypeChecked.map((config) => {
    const baseConfig = config;
    // @ts-expect-error - languageOptions may exist on config but TypeScript doesn't know
    const existingLanguageOptions = baseConfig.languageOptions || {};
    return {
      ...baseConfig,
      files: ['packages/database/**/*.ts'],
      languageOptions: {
        ...existingLanguageOptions,
        globals: globals.node,
        sourceType: 'module',
        parserOptions: {
          project: ['./packages/database/tsconfig.json'],
          tsconfigRootDir: import.meta.dirname,
        },
      },
    };
  }),
  // Apply type-checked configs for packages/shared
  ...tseslint.configs.recommendedTypeChecked.map((config) => {
    const baseConfig = config;
    // @ts-expect-error - languageOptions may exist on config but TypeScript doesn't know
    const existingLanguageOptions = baseConfig.languageOptions || {};
    return {
      ...baseConfig,
      files: ['packages/shared/**/*.ts'],
      languageOptions: {
        ...existingLanguageOptions,
        globals: globals.node,
        sourceType: 'module',
        parserOptions: {
          project: ['./packages/shared/tsconfig.json'],
          tsconfigRootDir: import.meta.dirname,
        },
      },
    };
  }),

  // Prettier integration (must be last to override formatting rules)
  // eslint-plugin-prettier/recommended includes both prettier plugin and disables conflicting rules
  // Include JSON files so Prettier can format them (after JSON linting validates them)
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
  },
];

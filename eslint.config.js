const globals = require('globals');

const base = require('@forvais/eslint-config-base');
const node = require('@forvais/eslint-config-node');
const ts = require('@forvais/eslint-config-typescript');

const react = require('eslint-plugin-react');
// const reactHooks = require('eslint-plugin-react-hooks');
const { default: reactRefresh } = require('eslint-plugin-react-refresh');

const reactQuery = require('@tanstack/eslint-plugin-query');

const backendConfigs = [
  ...base,
  ...node,
  ...ts,

  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2025,
      },
    },
  },
];

const frontendConfigs = [
  ...base,
  ...ts,
  ...reactQuery.configs['flat/recommended'],
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactRefresh.configs.recommended,
  // reactHooks.configs.recommended, -- At the time of writing, React hooks does not support flat configurations

  {
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
  },
];

const config = [
  ...backendConfigs.map(config => ({
    ...config,
    files: ['**/*.{ts,js,mjs}'],
  })),

  ...frontendConfigs.map(config => ({
    ...config,
    files: ['**/*.{tsx,ts,jsx,js,mjs}'],
  })),

  {
    rules: {
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off', // We want to be able to use `type` or `interface` interchangably as both have their benefits
      '@typescript-eslint/no-require-imports': 'off', // Require imports are still desirable and I see no point in restricting them
    },
  },
  {
    ignores: ['**/node_modules', '**/build', '**/dist'],
  },
];

module.exports = config;

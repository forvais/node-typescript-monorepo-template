// @ts-check

const rules = {
  'strict': 0,

  'space-before-function-paren': 0,
  'no-extra-parens': 0,

  'indent': [1, 2],
  'curly': 0,
  'multiline-comment-style': 0,
  'no-restricted-syntax': 0,

  'max-classes-per-file': 0,
  'class-methods-use-this': 0,
  'new-cap': 0,
  'newline-per-chained-call': 0,
  'prefer-destructuring': ['error', {
    'VariableDeclarator': {
      'array': false,
      'object': true,
    },
  }],

  'linebreak-style': [1, 'unix'],
};

const jsRules = { ...rules };
const tsRules = {
  ...rules,
  '@typescript-eslint/no-non-null-assertion': 0,
  '@typescript-eslint/no-namespace': 0,
};
const reactRules = {
  ...rules,
  ...tsRules,
  'react-refresh/only-export-components': 'warn',
};

/** @type {import('@typescript-eslint/utils').TSESLint.Linter.Config} */
module.exports = {
  env: {
    node: true,
    jest: true,
    es2022: true,
  },
  ignorePatterns: ['node_modules/', 'build/'],
  overrides: [
    {
      files: ['*.ts', '*.d.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint/eslint-plugin'],
      extends: [
        '@forvais/eslint-config-base',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: tsRules,
    },
    {
      files: ['*.tsx'],
      env: {
        browser: true,
      },
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
      plugins: ['@typescript-eslint/eslint-plugin', 'react', 'react-hooks', 'react-refresh', '@tanstack/query'],
      extends: [
        '@forvais/eslint-config-base',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:react-hooks/recommended',
        'plugin:@tanstack/eslint-plugin-query/recommended',
      ],
      rules: reactRules,
    },
    {
      files: ['*.js'],
      extends: [
        '@forvais/eslint-config-base',
      ],
      rules: jsRules,
    },
  ],
};

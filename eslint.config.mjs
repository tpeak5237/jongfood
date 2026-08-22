const browserGlobals = {
  window: 'readonly', document: 'readonly', navigator: 'readonly', crypto: 'readonly', fetch: 'readonly', FormData: 'readonly',
  setTimeout: 'readonly', clearTimeout: 'readonly', structuredClone: 'readonly', Intl: 'readonly', URL: 'readonly',
};

const sharedRules = {
  'no-undef': 'error',
  'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true }],
  'no-unreachable': 'error',
  'no-constant-condition': 'error',
};

export default [
  { ignores: ['dist/**', 'output/**', 'test-results/**', 'node_modules/**'] },
  { files: ['app.js'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...browserGlobals, console: 'readonly' } }, rules: sharedRules },
  { files: ['server.mjs', 'src/server/**/*.mjs', 'scripts/**/*.mjs', 'tests/**/*.mjs'], languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...browserGlobals, console: 'readonly', process: 'readonly', Buffer: 'readonly', URLSearchParams: 'readonly' } }, rules: sharedRules },
];

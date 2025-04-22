module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // Disable no-unused-vars for specific cases
    '@typescript-eslint/no-unused-vars': ['warn', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
      'destructuredArrayIgnorePattern': '^_'
    }],
    // Allow explicit any in specific cases
    '@typescript-eslint/no-explicit-any': 'warn',
    // Disable specific rules that might be too strict
    'react/no-unescaped-entities': 'off',
    '@next/next/no-img-element': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'react/display-name': 'off',
    '@typescript-eslint/no-empty-interface': ['error', {
      'allowSingleExtends': true
    }],
    // Disable custom rules that aren't installed
    'react-perf/jsx-no-new-object-as-prop': 'off',
    'style/jsx-inline-style': 'off'
  },
  ignorePatterns: ['*.js', '*.jsx', 'public/sw.js'],
} 
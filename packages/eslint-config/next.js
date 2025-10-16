module.exports = {
  extends: [
    './index.js',
    'next/core-web-vitals',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@next/next/no-html-link-for-pages': 'off',
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
}

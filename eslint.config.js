import antfu from '@antfu/eslint-config'

export default antfu(
  {},
  {
    ignores: [
      'index.js',
      'templates/**',
    ],
  },
  {
    rules: {
      'no-console': 'off',
    },
  },
)

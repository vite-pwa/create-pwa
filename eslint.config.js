import antfu from '@antfu/eslint-config'

export default antfu(
  {},
  {
    ignores: [
      'index.js',
      'template-**',
    ],
  },
  {
    rules: {
      'no-console': 'off',
    },
  },
)

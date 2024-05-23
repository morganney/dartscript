import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import nodePlugin from 'eslint-plugin-n'

export default tseslint.config(
  eslint.configs.recommended,
  nodePlugin.configs['flat/recommended'],
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-console': 'error',
      'n/no-process-exit': 'off',
      'n/hashbang': 'off',
    },
  },
)

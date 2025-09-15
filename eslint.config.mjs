// eslint.config.mjs
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import prettierPlugin from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  {
    plugins: {
      prettier: prettierPlugin,
      'simple-import-sort': simpleImportSort,
      unicorn: eslintPluginUnicorn,
    },
    rules: {
      // 'prettier/prettier': 'error',
      // 'simple-import-sort/imports': 'warn',
      // 'simple-import-sort/exports': 'warn',
      'unicorn/prevent-abbreviations': 'warn',
      'unicorn/expiring-todo-comments': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]

export default eslintConfig

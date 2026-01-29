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
  {
    ignores: ['.next/**', '.next/types/**'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  {
    plugins: {
      prettier: prettierPlugin,
      'simple-import-sort': simpleImportSort,
      unicorn: eslintPluginUnicorn,
    },
    rules: {
      // Si querés que prettier rompa build, descomentá:
      // 'prettier/prettier': 'error',

      // Orden de imports (yo lo dejaría warn)
      // 'simple-import-sort/imports': 'warn',
      // 'simple-import-sort/exports': 'warn',

      // 🚫 Unicorn NO te puede romper la vida
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/expiring-todo-comments': 'off',

      // 🚫 Any: no lo conviertas en error (esto te rompe el push)
      '@typescript-eslint/no-explicit-any': 'off',

      // (Opcional) si te rompe por variables no usadas durante refactors:
      // '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]

export default eslintConfig

// // eslint.config.mjs
// import { dirname } from 'path'
// import { fileURLToPath } from 'url'
// import { FlatCompat } from '@eslint/eslintrc'
// import prettierPlugin from 'eslint-plugin-prettier'
// import simpleImportSort from 'eslint-plugin-simple-import-sort'
// import eslintPluginUnicorn from 'eslint-plugin-unicorn'

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)

// const compat = new FlatCompat({ baseDirectory: __dirname })

// const eslintConfig = [
//   ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
//   {
//     plugins: {
//       prettier: prettierPlugin,
//       'simple-import-sort': simpleImportSort,
//       unicorn: eslintPluginUnicorn,
//     },
//     rules: {
//       // 'prettier/prettier': 'error',
//       // 'simple-import-sort/imports': 'warn',
//       // 'simple-import-sort/exports': 'warn',
//       'unicorn/prevent-abbreviations': 'warn',
//       'unicorn/expiring-todo-comments': 'warn',
//       '@typescript-eslint/no-explicit-any': 'error',
//     },
//   },
// ]

// export default eslintConfig

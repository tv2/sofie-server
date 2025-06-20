import tv2MediaEslintConfig from '@tv2media/eslint-config'

export default [
  ...tv2MediaEslintConfig,
  {
    ignores: ['.yarn/**', 'coverage/**', 'src/migrations/mongo/mongo-migrations/*.ts', 'database/**/*.ts'],
  },
]

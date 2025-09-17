import { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['dist'],
  testMatch: ['**/*.spec.ts'],
  maxWorkers: 2,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: './tsconfig.test.json' }
    ]
  },
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageReporters: ['json', 'json-summary', 'lcov', 'text'],
}

export default config

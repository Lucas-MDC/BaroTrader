const baseConfig = {
  clearMocks: true,
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.jsx'],
  moduleNameMapper: {
    '^/static/shared/js/utils.js$': '<rootDir>/src/shared/js/utils.js'
  },
  transform: {
    '^.+\\.jsx$': '<rootDir>/scripts/jest-esbuild-transform.cjs'
  }
};

module.exports = {
  collectCoverageFrom: ['<rootDir>/src/**/*.js'],
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/tests/'
  ],
  projects: [
    {
      ...baseConfig,
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js']
    },
    {
      ...baseConfig,
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unity/**/*.test.js']
    }
  ]
};

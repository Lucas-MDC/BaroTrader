const baseConfig = {
  clearMocks: true,
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.jsx'],
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

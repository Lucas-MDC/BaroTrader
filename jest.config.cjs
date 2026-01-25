const baseConfig = {
  clearMocks: true,
  testEnvironment: 'node',
  moduleNameMapper: {
    '^/static/shared/js/utils.js$': '<rootDir>/src/shared/js/utils.js'
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

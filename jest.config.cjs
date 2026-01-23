module.exports = {
  clearMocks: true,
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/unity/**/*.test.js',
    '<rootDir>/tests/integration/**/*.test.js'
  ],
  moduleNameMapper: {
    '^/static/shared/js/utils.js$': '<rootDir>/src/shared/js/utils.js'
  },
  collectCoverageFrom: ['<rootDir>/src/**/*.js'],
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/tests/'
  ]
};

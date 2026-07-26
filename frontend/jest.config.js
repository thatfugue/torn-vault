const nextJest = require('next/jest');

const createJestConfig = nextJest({

  dir: './',
});

const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',

  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

module.exports = createJestConfig(config);

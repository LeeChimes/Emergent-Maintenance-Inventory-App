module.exports = {
  testTimeout: 120000,
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['detox/runners/jest/adapter'],
  testMatch: ['**/?(*.)+(e2e).[tj]s?(x)']
};
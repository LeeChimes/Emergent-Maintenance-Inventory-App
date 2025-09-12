/* eslint-disable @typescript-eslint/no-var-requires */
const detox = require('detox');
const config = require('../detox.config').default || require('../detox.config');

beforeAll(async () => {
  await detox.init(config);
});

afterAll(async () => {
  await detox.cleanup();
});
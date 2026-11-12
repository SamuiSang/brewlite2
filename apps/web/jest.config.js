const nextJest = require('next/jest');

module.exports = nextJest({ dir: './' })({
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
});

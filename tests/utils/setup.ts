/**
 * Jest Test Setup
 * 
 * This file runs before all tests to set up the testing environment.
 */

// Set up environment variables for testing
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test'
}
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'https://taskmgt-p25dho9r3-dung-nguyens-projects-90b4d89b.vercel.app'
}
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = 'test-secret-key'
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Increase timeout for network requests
jest.setTimeout(30000)

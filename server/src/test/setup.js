// Server test setup
import { vi } from 'vitest';

// Mock console.error to suppress expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.('Warning:')) return;
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Increase timeout for database operations
vi.setConfig({ testTimeout: 15000 });
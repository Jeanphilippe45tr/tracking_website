// Tests for API client configuration
import { describe, it, expect } from 'vitest';
import apiClient, { USE_MOCK, API_URL, delay } from '../api/client';

describe('API client', () => {
  describe('USE_MOCK', () => {
    it('is a boolean', () => {
      expect(typeof USE_MOCK).toBe('boolean');
    });
  });

  describe('API_URL', () => {
    it('is a string', () => {
      expect(typeof API_URL).toBe('string');
    });

    it('defaults to localhost:5000/api', () => {
      expect(API_URL).toContain('localhost:5000/api');
    });
  });

  describe('delay', () => {
    it('resolves after specified milliseconds', async () => {
      const start = Date.now();
      await delay(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some tolerance
    });

    it('defaults to 500ms', async () => {
      const start = Date.now();
      await delay();
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(400);
    });
  });

  describe('apiClient', () => {
    it('has correct baseURL', () => {
      expect(apiClient.defaults.baseURL).toBe(API_URL);
    });

    it('has JSON content-type header', () => {
      expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
    });
  });
});
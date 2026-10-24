// Tests for server helpers
import { describe, it, expect } from 'vitest';
import { generateTrackingNumber, fold, clamp, STATUSES, PHONE_RE, EMAIL_RE } from '../utils/helpers';

describe('Server helpers', () => {
  describe('generateTrackingNumber', () => {
    it('generates a 12-character tracking number starting with TRK', () => {
      const tn = generateTrackingNumber();
      expect(tn).toMatch(/^TRK[A-Z0-9]{9}$/);
    });

    it('does not contain confusing characters O, 0, I', () => {
      const tn = generateTrackingNumber();
      expect(tn).not.toMatch(/[O0I]/);
    });

    it('generates unique numbers', () => {
      const tn1 = generateTrackingNumber();
      const tn2 = generateTrackingNumber();
      expect(tn1).not.toBe(tn2);
    });
  });

  describe('fold', () => {
    it('lowercases and trims', () => {
      expect(fold('  Hello World  ')).toBe('hello world');
    });

    it('strips accents', () => {
      expect(fold('São Paulo')).toBe('sao paulo');
      expect(fold('CAFÉ')).toBe('cafe');
    });

    it('handles null/undefined', () => {
      expect(fold(null)).toBe('');
      expect(fold(undefined)).toBe('');
    });
  });

  describe('clamp', () => {
    it('clamps value between min and max', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('STATUSES', () => {
    it('contains all expected statuses', () => {
      expect(STATUSES).toEqual([
        'Created',
        'Picked up',
        'In transit',
        'Out for delivery',
        'Delivered',
        'Delayed',
      ]);
    });
  });

  describe('PHONE_RE', () => {
    it('matches valid phone numbers', () => {
      expect(PHONE_RE.test('+1 (555) 123-4567')).toBe(true);
      expect(PHONE_RE.test('555-123-4567')).toBe(true);
      expect(PHONE_RE.test('+44 20 7946 0321')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(PHONE_RE.test('abc')).toBe(false);
      expect(PHONE_RE.test('')).toBe(false);
      expect(PHONE_RE.test('123')).toBe(false); // too short
    });
  });

  describe('EMAIL_RE', () => {
    it('matches valid emails', () => {
      expect(EMAIL_RE.test('test@example.com')).toBe(true);
      expect(EMAIL_RE.test('user.name@domain.co.uk')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(EMAIL_RE.test('invalid')).toBe(false);
      expect(EMAIL_RE.test('@domain.com')).toBe(false);
      expect(EMAIL_RE.test('user@')).toBe(false);
      expect(EMAIL_RE.test('')).toBe(false);
    });
  });
});
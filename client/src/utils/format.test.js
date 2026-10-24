// Tests for format utility functions
import { describe, it, expect } from 'vitest';
import { formatDateTime, formatDate, formatChatTime } from '../utils/format';

describe('format utilities', () => {
  describe('formatDateTime', () => {
    it('formats ISO string to DD MMM YYYY, HH:mm', () => {
      const result = formatDateTime('2026-10-23T14:30:00.000Z');
      expect(result).toMatch(/23 Oct 2026/);
      // Time will vary by timezone, just check format
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('returns "-" for null/undefined', () => {
      expect(formatDateTime(null)).toBe('-');
      expect(formatDateTime(undefined)).toBe('-');
    });

    it('returns "-" for invalid date', () => {
      expect(formatDateTime('invalid')).toBe('-');
    });
  });

  describe('formatDate', () => {
    it('formats ISO string to DD MMM YYYY', () => {
      const result = formatDate('2026-10-23T14:30:00.000Z');
      expect(result).toMatch(/23 Oct 2026/);
      expect(result).not.toMatch(/14:30/);
    });

    it('returns "-" for null/undefined', () => {
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined)).toBe('-');
    });
  });

  describe('formatChatTime', () => {
    it('formats time for today', () => {
      const now = new Date();
      const isoString = now.toISOString();
      const result = formatChatTime(isoString);
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('formats date for older messages', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = formatChatTime(yesterday.toISOString());
      expect(result).toMatch(/^\d{2} \w{3}$/);
    });

    it('returns empty string for null/undefined', () => {
      expect(formatChatTime(null)).toBe('');
      expect(formatChatTime(undefined)).toBe('');
    });
  });
});
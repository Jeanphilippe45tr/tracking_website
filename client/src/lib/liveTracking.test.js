// Tests for liveTracking utility functions
import { describe, it, expect } from 'vitest';
import {
  buildRoute,
  positionAt,
  trailAt,
  statusLabelFor,
  SIM_BASE_DURATION_MS,
  SPEED_OPTIONS,
  LIVE_STATUS,
} from '../lib/liveTracking';

describe('liveTracking utilities', () => {
  describe('buildRoute', () => {
    it('returns a 3-point array for different cities', () => {
      const route = buildRoute('New York', 'Boston');
      expect(route).toHaveLength(3);
      expect(route[0]).toEqual(expect.arrayContaining([expect.any(Number), expect.any(Number)]));
      expect(route[2]).toEqual(expect.arrayContaining([expect.any(Number), expect.any(Number)]));
    });

    it('returns a small loop for same city', () => {
      const route = buildRoute('New York', 'New York');
      expect(route).toHaveLength(3);
      // First and last should be the same (approximately)
      expect(route[0][0]).toBeCloseTo(route[2][0], 3);
      expect(route[0][1]).toBeCloseTo(route[2][1], 3);
    });

    it('handles unknown cities with default center', () => {
      const route = buildRoute('Unknown City', 'Another Unknown');
      expect(route).toHaveLength(3);
    });
  });

  describe('positionAt', () => {
    const route = [
      [40.7128, -74.006], // New York
      [41.0, -73.0],      // Middle
      [42.3601, -71.0589], // Boston
    ];

    it('returns start position at progress 0', () => {
      const pos = positionAt(route, 0);
      expect(pos.lat).toBeCloseTo(40.7128, 3);
      expect(pos.lng).toBeCloseTo(-74.006, 3);
    });

    it('returns end position at progress 1', () => {
      const pos = positionAt(route, 1);
      expect(pos.lat).toBeCloseTo(42.3601, 3);
      expect(pos.lng).toBeCloseTo(-71.0589, 3);
    });

    it('returns interpolated position at progress 0.5', () => {
      const pos = positionAt(route, 0.5);
      expect(pos.lat).toBeGreaterThan(40.7128);
      expect(pos.lat).toBeLessThan(42.3601);
    });

    it('handles empty route', () => {
      expect(positionAt([], 0.5)).toBeNull();
    });

    it('handles single point route', () => {
      const pos = positionAt([[40.7128, -74.006]], 0.5);
      expect(pos.lat).toBe(40.7128);
      expect(pos.lng).toBe(-74.006);
    });
  });

  describe('trailAt', () => {
    const route = [
      [40.7128, -74.006],
      [41.0, -73.0],
      [42.3601, -71.0589],
    ];

    it('returns start point at progress 0', () => {
      const trail = trailAt(route, 0);
      expect(trail).toHaveLength(1);
      expect(trail[0]).toEqual([40.7128, -74.006]);
    });

    it('returns full route at progress 1', () => {
      const trail = trailAt(route, 1);
      expect(trail).toHaveLength(3);
    });

    it('returns partial trail at progress 0.5', () => {
      const trail = trailAt(route, 0.5);
      expect(trail.length).toBeGreaterThan(1);
      expect(trail.length).toBeLessThanOrEqual(3);
    });
  });

  describe('statusLabelFor', () => {
    it('returns "Preparing pickup" for progress < 0.12', () => {
      expect(statusLabelFor(0)).toBe('Preparing pickup');
      expect(statusLabelFor(0.1)).toBe('Preparing pickup');
    });

    it('returns "Picked up" for progress >= 0.12 and < 0.35', () => {
      expect(statusLabelFor(0.12)).toBe('Picked up');
      expect(statusLabelFor(0.2)).toBe('Picked up');
    });

    it('returns "In transit" for progress >= 0.35 and < 0.92', () => {
      expect(statusLabelFor(0.35)).toBe('In transit');
      expect(statusLabelFor(0.5)).toBe('In transit');
    });

    it('returns "Out for delivery" for progress >= 0.92 and < 1', () => {
      expect(statusLabelFor(0.92)).toBe('Out for delivery');
      expect(statusLabelFor(0.95)).toBe('Out for delivery');
    });

    it('returns "Delivered" for progress >= 1', () => {
      expect(statusLabelFor(1)).toBe('Delivered');
      expect(statusLabelFor(1.5)).toBe('Delivered');
    });
  });

  describe('constants', () => {
    it('has correct SIM_BASE_DURATION_MS', () => {
      expect(SIM_BASE_DURATION_MS).toBe(120000);
    });

    it('has correct SPEED_OPTIONS', () => {
      expect(SPEED_OPTIONS).toEqual([1, 2, 5, 10]);
    });

    it('has correct LIVE_STATUS values', () => {
      expect(LIVE_STATUS).toEqual({
        IDLE: 'idle',
        RUNNING: 'running',
        PAUSED: 'paused',
        STOPPED: 'stopped',
        COMPLETED: 'completed',
      });
    });
  });
});
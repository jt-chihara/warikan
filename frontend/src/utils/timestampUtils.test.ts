import { describe, expect, it } from 'vitest';
import { timestampToDate, timestampToString } from './timestampUtils';

describe('timestampUtils', () => {
  describe('timestampToDate', () => {
    it('should convert Timestamp object to Date', () => {
      const timestamp = {
        seconds: 1753447425,
        nanos: 322253000,
      };
      const date = timestampToDate(timestamp);

      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBe(1753447425322); // seconds * 1000 + nanos / 1000000
    });

    it('should handle string timestamp', () => {
      const timestamp = '2025-01-25T12:00:00Z';
      const date = timestampToDate(timestamp);

      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString()).toBe('2025-01-25T12:00:00.000Z');
    });

    it('should handle zero nanos', () => {
      const timestamp = {
        seconds: 1753447425,
        nanos: 0,
      };
      const date = timestampToDate(timestamp);

      expect(date.getTime()).toBe(1753447425000);
    });
  });

  describe('timestampToString', () => {
    it('should convert Timestamp object to ISO string', () => {
      const timestamp = {
        seconds: 1753447425,
        nanos: 322253000,
      };
      const dateString = timestampToString(timestamp);

      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle string timestamp', () => {
      const timestamp = '2025-01-25T12:00:00Z';
      const dateString = timestampToString(timestamp);

      expect(dateString).toBe('2025-01-25T12:00:00.000Z');
    });
  });
});

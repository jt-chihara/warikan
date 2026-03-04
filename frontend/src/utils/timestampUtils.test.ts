import { describe, expect, it } from 'vitest';
import { timestampToDate, timestampToString } from './timestampUtils';

describe('timestampUtils', () => {
  describe('timestampToDate', () => {
    it('TimestampオブジェクトをDateに変換する', () => {
      const timestamp = {
        seconds: 1753447425,
        nanos: 322253000,
      };
      const date = timestampToDate(timestamp);

      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBe(1753447425322); // seconds * 1000 + nanos / 1000000
    });

    it('文字列のタイムスタンプを処理する', () => {
      const timestamp = '2025-01-25T12:00:00Z';
      const date = timestampToDate(timestamp);

      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString()).toBe('2025-01-25T12:00:00.000Z');
    });

    it('nanosが0の場合を処理する', () => {
      const timestamp = {
        seconds: 1753447425,
        nanos: 0,
      };
      const date = timestampToDate(timestamp);

      expect(date.getTime()).toBe(1753447425000);
    });
  });

  describe('timestampToString', () => {
    it('TimestampオブジェクトをISO文字列に変換する', () => {
      const timestamp = {
        seconds: 1753447425,
        nanos: 322253000,
      };
      const dateString = timestampToString(timestamp);

      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('文字列のタイムスタンプを処理する', () => {
      const timestamp = '2025-01-25T12:00:00Z';
      const dateString = timestampToString(timestamp);

      expect(dateString).toBe('2025-01-25T12:00:00.000Z');
    });
  });
});

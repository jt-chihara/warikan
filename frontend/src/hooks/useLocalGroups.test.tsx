import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Group } from '../types/group';
import { useLocalGroups } from './useLocalGroups';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  key: vi.fn(),
  length: 0,
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useLocalGroups', () => {
  const mockGroup: Group = {
    id: 'group-123',
    name: 'テストグループ',
    currency: 'JPY',
    createdAt: '2024-01-01',
    members: [{ id: 'member-1', name: 'Alice', joinedAt: '2024-01-01' }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('localStorageが空の場合に空のグループで初期化する', () => {
    const { result } = renderHook(() => useLocalGroups());

    expect(result.current.groups).toEqual([]);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('warikan_groups');
  });

  it('localStorageからグループを初期化する', () => {
    const storedGroups = [mockGroup];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedGroups));

    const { result } = renderHook(() => useLocalGroups());

    expect(result.current.groups).toEqual(storedGroups);
  });

  it('localStorageの無効なJSONを適切に処理する', () => {
    localStorageMock.getItem.mockReturnValue('invalid json');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useLocalGroups());

    expect(result.current.groups).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('グループを追加してlocalStorageに保存する', () => {
    const { result } = renderHook(() => useLocalGroups());

    act(() => {
      result.current.addGroup(mockGroup);
    });

    expect(result.current.groups).toEqual([mockGroup]);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'warikan_groups',
      JSON.stringify([mockGroup]),
    );
  });

  it('重複するグループを追加しない', () => {
    const { result } = renderHook(() => useLocalGroups());

    act(() => {
      result.current.addGroup(mockGroup);
    });

    act(() => {
      result.current.addGroup(mockGroup);
    });

    expect(result.current.groups).toEqual([mockGroup]);
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
  });

  it('リストの先頭に新しいグループを追加する', () => {
    const firstGroup = { ...mockGroup, id: 'group-1' };
    const secondGroup = { ...mockGroup, id: 'group-2', name: 'グループ2' };

    const { result } = renderHook(() => useLocalGroups());

    act(() => {
      result.current.addGroup(firstGroup);
    });

    act(() => {
      result.current.addGroup(secondGroup);
    });

    expect(result.current.groups).toEqual([secondGroup, firstGroup]);
  });

  it('localStorageのエラーを適切に処理する', () => {
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useLocalGroups());

    act(() => {
      result.current.addGroup(mockGroup);
    });

    expect(result.current.groups).toEqual([mockGroup]);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to save groups to localStorage:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});

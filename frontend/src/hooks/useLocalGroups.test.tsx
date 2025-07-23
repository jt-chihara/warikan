import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalGroups } from './useLocalGroups';
import type { Group } from '../types/group';

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
    members: [
      { id: 'member-1', name: 'Alice', joinedAt: '2024-01-01' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('initializes with empty groups when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalGroups());
    
    expect(result.current.groups).toEqual([]);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('warikan_groups');
  });

  it('initializes with groups from localStorage', () => {
    const storedGroups = [mockGroup];
    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedGroups));
    
    const { result } = renderHook(() => useLocalGroups());
    
    expect(result.current.groups).toEqual(storedGroups);
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid json');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useLocalGroups());
    
    expect(result.current.groups).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('adds a group and saves to localStorage', () => {
    const { result } = renderHook(() => useLocalGroups());
    
    act(() => {
      result.current.addGroup(mockGroup);
    });
    
    expect(result.current.groups).toEqual([mockGroup]);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'warikan_groups',
      JSON.stringify([mockGroup])
    );
  });

  it('does not add duplicate groups', () => {
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

  it('adds new group to beginning of list', () => {
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

  it('handles localStorage errors gracefully', () => {
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
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });
});
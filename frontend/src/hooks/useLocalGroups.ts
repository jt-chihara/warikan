import { useEffect, useState } from 'react';
import type { Group } from '../types/group';

const GROUPS_STORAGE_KEY = 'warikan_groups';

export function useLocalGroups() {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (stored) {
      try {
        setGroups(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing stored groups:', error);
      }
    }
  }, []);

  const addGroup = (group: Group) => {
    // 重複チェック
    if (groups.find((g) => g.id === group.id)) {
      return;
    }

    try {
      // 新しいグループを先頭に追加
      const updatedGroups = [group, ...groups];
      setGroups(updatedGroups);
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(updatedGroups));
    } catch (error) {
      console.error('Failed to save groups to localStorage:', error);
    }
  };

  const updateGroup = (groupId: string, updates: Partial<Group>) => {
    try {
      const updatedGroups = groups.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group,
      );
      setGroups(updatedGroups);
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(updatedGroups));
    } catch (error) {
      console.error('Failed to save groups to localStorage:', error);
    }
  };

  const removeGroup = (groupId: string) => {
    try {
      const updatedGroups = groups.filter((group) => group.id !== groupId);
      setGroups(updatedGroups);
      localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(updatedGroups));
    } catch (error) {
      console.error('Failed to save groups to localStorage:', error);
    }
  };

  return {
    groups,
    addGroup,
    updateGroup,
    removeGroup,
  };
}

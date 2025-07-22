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
    const updatedGroups = [...groups, group];
    setGroups(updatedGroups);
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(updatedGroups));
  };

  const updateGroup = (groupId: string, updates: Partial<Group>) => {
    const updatedGroups = groups.map((group) =>
      group.id === groupId ? { ...group, ...updates } : group,
    );
    setGroups(updatedGroups);
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(updatedGroups));
  };

  const removeGroup = (groupId: string) => {
    const updatedGroups = groups.filter((group) => group.id !== groupId);
    setGroups(updatedGroups);
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(updatedGroups));
  };

  return {
    groups,
    addGroup,
    updateGroup,
    removeGroup,
  };
}

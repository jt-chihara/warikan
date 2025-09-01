import { useCallback, useEffect, useRef, useState } from 'react';
import type { CreateGroupInput, ExpenseInput, Group, SettlementResult } from '../types/group';
import {
  createGroup as createGroupRest,
  getGroup as getGroupRest,
  calculateSettlements as calculateSettlementsRest,
} from '../lib/rest-client';

export function useCreateGroup() {
  // REST-compatible shape
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const mutate = useCallback(async (
    vars:
      | { input: CreateGroupInput }
      | { variables: { input: CreateGroupInput } },
  ) => {
    try {
      setError(undefined);
      setLoading(true);
      const input = 'input' in vars ? vars.input : vars.variables.input;
      const res = await createGroupRest(input);
      return { data: { createGroup: res } } as { data: { createGroup: Group } };
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);
  return [mutate, { loading, error }] as const;
}

export function useGroup(id: string) {
  const [data, setData] = useState<{ group: Group } | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [error, setError] = useState<Error | undefined>(undefined);
  const currentId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    currentId.current = id;
    setLoading(true);
    setError(undefined);
    getGroupRest(id)
      .then((g) => {
        // ensure latest id
        if (currentId.current === id) {
          setData({ group: g });
        }
      })
      .catch((e) => setError(e as Error))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error } as const;
}

export function useCalculateSettlements() {
  const [loading, setLoading] = useState(false);
  const refetch = useCallback(async (vars: { groupId: string; expenses: ExpenseInput[] }) => {
    setLoading(true);
    try {
      const res = await calculateSettlementsRest(vars.groupId, vars.expenses);
      return { data: { calculateSettlements: res } } as { data: { calculateSettlements: SettlementResult } };
    } finally {
      setLoading(false);
    }
  }, []);
  return { refetch, loading } as const;
}

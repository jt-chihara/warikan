import { useCallback, useEffect, useRef, useState } from 'react';
import type { AddExpenseInput, Expense, UpdateExpenseInput } from '../types/group';
import {
  addExpense as addExpenseRest,
  updateExpense as updateExpenseRest,
  deleteExpense as deleteExpenseRest,
  listExpenses as listExpensesRest,
} from '../lib/rest-client';

export function useAddExpense() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const mutate = useCallback(async (
    vars:
      | { input: AddExpenseInput }
      | { variables: { input: AddExpenseInput } },
  ) => {
    try {
      setError(undefined);
      setLoading(true);
      const input = 'input' in vars ? vars.input : vars.variables.input;
      const res = await addExpenseRest(input);
      return { data: { addExpense: res } } as { data: { addExpense: Expense } };
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);
  return [mutate, { loading, error }] as const;
}

export function useUpdateExpense() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const mutate = useCallback(async (
    vars:
      | { input: UpdateExpenseInput }
      | { variables: { input: UpdateExpenseInput } },
  ) => {
    try {
      setError(undefined);
      setLoading(true);
      const input = 'input' in vars ? vars.input : vars.variables.input;
      const res = await updateExpenseRest(input);
      return { data: { updateExpense: res } } as { data: { updateExpense: Expense } };
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);
  return [mutate, { loading, error }] as const;
}

export function useDeleteExpense() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const mutate = useCallback(async (
    vars: { expenseId: string } | { variables: { expenseId: string } },
  ) => {
    try {
      setError(undefined);
      setLoading(true);
      const expenseId = 'expenseId' in vars ? vars.expenseId : vars.variables.expenseId;
      await deleteExpenseRest('', expenseId);
      return { data: { deleteExpense: true } } as { data: { deleteExpense: boolean } };
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);
  return [mutate, { loading, error }] as const;
}

export function useGroupExpenses(groupId: string) {
  if (!groupId) {
    return { data: undefined, loading: false, error: undefined } as const;
  }

  const [data, setData] = useState<{ groupExpenses: Expense[] } | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const currentId = useRef<string | undefined>(undefined);

  const fetchExpenses = useCallback(async (id: string) => {
    setLoading(true);
    setError(undefined);
    try {
      const list = await listExpensesRest(id);
      if (currentId.current === id) {
        setData({ groupExpenses: list });
      }
      return list;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    currentId.current = groupId;
    fetchExpenses(groupId).catch(() => {});
  }, [groupId, fetchExpenses]);

  const refetch = useCallback(() => fetchExpenses(groupId), [fetchExpenses, groupId]);

  return { data, loading, error, refetch } as const;
}

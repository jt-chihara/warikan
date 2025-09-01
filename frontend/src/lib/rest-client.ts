import type {
  AddExpenseInput,
  CreateGroupInput,
  Expense,
  ExpenseInput,
  Group,
  SettlementResult,
  UpdateExpenseInput,
} from '../types/group';

const BASE_URL = (import.meta.env['VITE_REST_ENDPOINT'] as string) || 'http://localhost:8080';
const API_KEY = (import.meta.env['VITE_API_KEY'] as string) || '';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

// Groups
export const listGroups = () => apiFetch<Group[]>('/groups');
export const getGroup = (id: string) => apiFetch<Group>(`/groups/${id}`);
export const createGroup = (input: CreateGroupInput) =>
  apiFetch<Group>('/groups', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      currency: input.currency,
      memberNames: input.memberNames,
    }),
  });
export const updateGroup = (
  id: string,
  input: { name: string; description?: string; currency: string },
) => apiFetch<Group>(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(input) });
export const deleteGroup = (id: string) => apiFetch<void>(`/groups/${id}`, { method: 'DELETE' });

// Members
export const addMember = (groupId: string, memberName: string, memberEmail?: string) =>
  apiFetch(`/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ memberName, memberEmail }),
  });
export const removeMember = (groupId: string, memberId: string) =>
  apiFetch<void>(`/groups/${groupId}/members/${memberId}`, { method: 'DELETE' });

// Expenses
export const listExpenses = (groupId: string) => apiFetch<Expense[]>(`/groups/${groupId}/expenses`);
export const addExpense = (input: AddExpenseInput) =>
  apiFetch<Expense>(`/groups/${input.groupId}/expenses`, {
    method: 'POST',
    body: JSON.stringify({
      amount: input.amount,
      description: input.description,
      paidById: input.paidById,
      splitMemberIds: input.splitMemberIds,
    }),
  });
export const updateExpense = (input: UpdateExpenseInput) =>
  apiFetch<Expense>(`/expenses/${input.expenseId}`, {
    method: 'PUT',
    body: JSON.stringify({
      amount: input.amount,
      description: input.description,
      paidById: input.paidById,
      splitMemberIds: input.splitMemberIds,
    }),
  });
export const deleteExpense = (_groupId: string, expenseId: string) =>
  apiFetch<void>(`/expenses/${expenseId}`, { method: 'DELETE' });

// Settlements
export const calculateSettlements = (groupId: string, expenses: ExpenseInput[]) =>
  apiFetch<SettlementResult>(`/groups/${groupId}/settlements/calculate`, {
    method: 'POST',
    body: JSON.stringify({ expenses }),
  });

export const isRestMode = () => (import.meta.env['VITE_API_MODE'] as string) === 'rest';

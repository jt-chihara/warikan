import { gql, useMutation, useQuery } from '@apollo/client';
import type { AddExpenseInput, Expense } from '../types/group';

const ADD_EXPENSE = gql`
  mutation AddExpense($input: AddExpenseInput!) {
    addExpense(input: $input) {
      id
      groupId
      amount
      description
      paidById
      paidByName
      splitMembers {
        memberId
        memberName
        amount
      }
      createdAt
    }
  }
`;

const DELETE_EXPENSE = gql`
  mutation DeleteExpense($expenseId: ID!) {
    deleteExpense(expenseId: $expenseId)
  }
`;

const GET_GROUP_EXPENSES = gql`
  query GetGroupExpenses($groupId: ID!) {
    groupExpenses(groupId: $groupId) {
      id
      groupId
      amount
      description
      paidById
      paidByName
      splitMembers {
        memberId
        memberName
        amount
      }
      createdAt
    }
  }
`;

export function useAddExpense() {
  return useMutation<{ addExpense: Expense }, { input: AddExpenseInput }>(ADD_EXPENSE);
}

export function useDeleteExpense() {
  return useMutation<{ deleteExpense: boolean }, { expenseId: string }>(DELETE_EXPENSE);
}

export function useGroupExpenses(groupId: string) {
  return useQuery<{ groupExpenses: Expense[] }, { groupId: string }>(GET_GROUP_EXPENSES, {
    variables: { groupId },
    skip: !groupId,
  });
}

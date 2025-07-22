import { gql, useMutation, useQuery } from '@apollo/client';
import type { CreateGroupInput, Expense, Group, SettlementResult } from '../types/group';

const CREATE_GROUP_MUTATION = gql`
  mutation CreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) {
      id
      name
      description
      currency
      createdAt
      members {
        id
        name
        email
        joinedAt
      }
    }
  }
`;

const GET_GROUP_QUERY = gql`
  query GetGroup($id: ID!) {
    group(id: $id) {
      id
      name
      description
      currency
      createdAt
      updatedAt
      members {
        id
        name
        email
        joinedAt
      }
    }
  }
`;

const CALCULATE_SETTLEMENTS_QUERY = gql`
  query CalculateSettlements($groupId: ID!, $expenses: [ExpenseInput!]!) {
    calculateSettlements(groupId: $groupId, expenses: $expenses) {
      settlements {
        fromMemberId
        toMemberId
        amount
        fromName
        toName
      }
      balances {
        memberId
        memberName
        balance
      }
    }
  }
`;

export function useCreateGroup() {
  return useMutation<{ createGroup: Group }, { input: CreateGroupInput }>(CREATE_GROUP_MUTATION);
}

export function useGroup(id: string) {
  return useQuery<{ group: Group }, { id: string }>(GET_GROUP_QUERY, {
    variables: { id },
    skip: !id,
  });
}

export function useCalculateSettlements() {
  return useQuery<
    { calculateSettlements: SettlementResult },
    { groupId: string; expenses: Expense[] }
  >(CALCULATE_SETTLEMENTS_QUERY, {
    skip: true, // Manual execution
  });
}

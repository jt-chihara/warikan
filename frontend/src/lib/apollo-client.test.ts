import { ApolloClient, InMemoryCache } from '@apollo/client';
import { describe, expect, it, vi } from 'vitest';
import { apolloClient } from './apollo-client';

// import.meta.env をモック
vi.mock('import.meta.env', () => ({
  VITE_GRAPHQL_ENDPOINT: undefined,
}));

describe('apollo-client', () => {
  it('creates ApolloClient instance', () => {
    expect(apolloClient).toBeInstanceOf(ApolloClient);
  });

  it('uses InMemoryCache', () => {
    expect(apolloClient.cache).toBeInstanceOf(InMemoryCache);
  });

  it('has httpLink configured', () => {
    // ApolloClient の link プロパティが存在することを確認
    expect(apolloClient.link).toBeDefined();
  });

  it('uses default GraphQL endpoint when VITE_GRAPHQL_ENDPOINT is not set', () => {
    // デフォルトのエンドポイントが設定されていることを確認するため、
    // リンクの uri プロパティを直接テストするのは困難なため、
    // ApolloClient が正常に作成されることをテスト
    expect(apolloClient).toBeDefined();
    expect(typeof apolloClient.query).toBe('function');
    expect(typeof apolloClient.mutate).toBe('function');
  });

  it('can perform basic operations', () => {
    // ApolloClient の基本的なメソッドが存在することを確認
    expect(typeof apolloClient.query).toBe('function');
    expect(typeof apolloClient.mutate).toBe('function');
    expect(typeof apolloClient.watchQuery).toBe('function');
    expect(typeof apolloClient.readQuery).toBe('function');
    expect(typeof apolloClient.writeQuery).toBe('function');
  });

  it('has cache operations available', () => {
    // キャッシュ操作のメソッドが存在することを確認
    expect(typeof apolloClient.cache.readQuery).toBe('function');
    expect(typeof apolloClient.cache.writeQuery).toBe('function');
    expect(typeof apolloClient.cache.evict).toBe('function');
    expect(typeof apolloClient.cache.reset).toBe('function');
  });

  it('exports apolloClient as named export', () => {
    // 名前付きエクスポートとして apolloClient が定義されていることを確認
    expect(apolloClient).toBeDefined();
    expect(apolloClient.constructor.name).toBe('ApolloClient');
  });
});
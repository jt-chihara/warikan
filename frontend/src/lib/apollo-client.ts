import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: import.meta.env['VITE_GRAPHQL_ENDPOINT'] || 'http://localhost:8080/graphql',
});

const authLink = setContext((_, { headers }) => {
  // Get API key from environment variable
  const apiKey = import.meta.env['VITE_API_KEY'];
  
  return {
    headers: {
      ...headers,
      'X-API-Key': apiKey || '',
    }
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

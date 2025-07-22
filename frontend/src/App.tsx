import { ApolloProvider } from '@apollo/client';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { apolloClient } from './lib/apollo-client';
import CreateGroupPage from './pages/CreateGroupPage';
import GroupPage from './pages/GroupPage';
import HomePage from './pages/HomePage';

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/groups/new" element={<CreateGroupPage />} />
            <Route path="/groups/:groupId" element={<GroupPage />} />
          </Routes>
        </Layout>
      </Router>
    </ApolloProvider>
  );
}

export default App;

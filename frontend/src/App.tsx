import { ApolloProvider } from '@apollo/client';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { apolloClient } from './lib/apollo-client';
import AnalyticsPage from './pages/AnalyticsPage';
import CreateGroupPage from './pages/CreateGroupPage';
import GroupPage from './pages/GroupPage';
import HomePage from './pages/HomePage';
import TermsOfServicePage from './pages/TermsOfServicePage';

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/groups/new" element={<CreateGroupPage />} />
            <Route path="/groups/:groupId" element={<GroupPage />} />
            <Route path="/groups/:groupId/analytics" element={<AnalyticsPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
          </Routes>
        </Layout>
      </Router>
    </ApolloProvider>
  );
}

export default App;

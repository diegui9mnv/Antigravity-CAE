import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { AppProvider, useApp } from './context/AppContext';
import Login from './pages/Login/Login';

import Dashboard from './pages/Dashboard/Dashboard';
import Contracts from './pages/Contracts/Contracts';
import Projects from './pages/Projects/Projects';
import ProjectDetails from './pages/Projects/ProjectDetails';
import Companies from './pages/Companies/Companies';
import WorkCenters from './pages/WorkCenters/WorkCenters';
import Signing from './pages/Signing/Signing';
import Templates from './pages/Templates/Templates';
import Users from './pages/Users/Users';

const ProtectedRoute = () => {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Layout />;
};

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute />}>
            <Route index element={<Dashboard />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="companies" element={<Companies />} />
            <Route path="work-centers" element={<WorkCenters />} />
            <Route path="templates" element={<Templates />} />
            <Route path="users" element={<Users />} />
          </Route>
          <Route path="/signing/:id" element={<Signing />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;

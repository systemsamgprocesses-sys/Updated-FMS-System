import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DataCacheProvider } from './context/DataCacheContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CreateFMS = lazy(() => import('./pages/CreateFMS'));
const StartProject = lazy(() => import('./pages/StartProject'));
const Logs = lazy(() => import('./pages/Logs'));
const UserManagement = lazy(() => import('./pages/UserManagement'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <DataCacheProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/create-fms"
              element={
                <PrivateRoute>
                  <Layout>
                    <CreateFMS />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/start-project"
              element={
                <PrivateRoute>
                  <Layout>
                    <StartProject />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <PrivateRoute>
                  <Layout>
                    <Logs />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRoute>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </DataCacheProvider>
  );
}

export default App;

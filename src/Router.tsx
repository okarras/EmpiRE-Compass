import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminGuard from './auth/AdminGuard';
import ErrorFallback from './pages/ErrorFallback';

const Home = lazy(() => import('./pages/Home'));
const Statistics = lazy(() => import('./pages/Statistics'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Layout = lazy(() => import('./pages/Layout'));
const QuestionPage = lazy(() => import('./pages/QuestionPage'));
const QuestionDashboardPage = lazy(
  () => import('./pages/QuestionDashboardPage')
);
const DynamicQuestionPage = lazy(() => import('./pages/DynamicQuestionPage'));
const TemplateGraphPage = lazy(() => import('./pages/TemplateGraphPage'));
const Team = lazy(() => import('./pages/Team'));
const AdminBackup = lazy(() => import('./pages/AdminBackup'));
const AdminDataManagement = lazy(() => import('./pages/AdminDataManagement'));
const AdminHomeContent = lazy(() => import('./pages/AdminHomeContent'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminRequestMonitor = lazy(() => import('./pages/AdminRequestMonitor'));

const Router = () => {
  return (
    <>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/:templateId/" element={<Layout />}>
            <Route
              path=""
              element={<Home />}
              errorElement={<ErrorFallback />}
            />
            <Route
              path="statistics"
              element={<Statistics />}
              errorElement={<ErrorFallback />}
            />
            <Route
              path="questions/:id"
              element={<QuestionPage />}
              errorElement={<ErrorFallback />}
            />
            <Route
              path="allquestions"
              element={<QuestionDashboardPage />}
              errorElement={<ErrorFallback />}
            />
            <Route
              path="dynamic-question"
              element={<DynamicQuestionPage />}
              errorElement={<ErrorFallback />}
            />
            <Route
              path="schema"
              element={<TemplateGraphPage />}
              errorElement={<ErrorFallback />}
            />
            <Route
              path="team"
              element={<Team />}
              errorElement={<ErrorFallback />}
            />
            <Route
              path="admin"
              element={
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              }
              errorElement={<ErrorFallback />}
            />
            <Route
              path="admin/backup"
              element={
                <AdminGuard>
                  <AdminBackup />
                </AdminGuard>
              }
              errorElement={<ErrorFallback />}
            />
            <Route
              path="admin/data"
              element={
                <AdminGuard>
                  <AdminDataManagement />
                </AdminGuard>
              }
              errorElement={<ErrorFallback />}
            />
            <Route
              path="admin/home-content"
              element={
                <AdminGuard>
                  <AdminHomeContent />
                </AdminGuard>
              }
              errorElement={<ErrorFallback />}
            />
            <Route
              path="admin/request-monitor"
              element={
                <AdminGuard>
                  <AdminRequestMonitor />
                </AdminGuard>
              }
              errorElement={<ErrorFallback />}
            />
          </Route>

          <Route path="/" element={<Navigate to="/R186491/" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
};

export default Router;

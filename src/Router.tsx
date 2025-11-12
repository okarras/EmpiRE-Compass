import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Statistics from './pages/Statistics';
import NotFound from './pages/NotFound';
import ErrorFallback from './pages/ErrorFallback';
import Layout from './pages/Layout';
import QuestionPage from './pages/QuestionPage';
import QuestionDashboardPage from './pages/QuestionDashboardPage';
import DynamicQuestionPage from './pages/DynamicQuestionPage';
import TemplateGraphPage from './pages/TemplateGraphPage';
import ContributeViewer from './pages/ContributeViewer';
import ContributePage from './pages/ContributePage';
import Team from './pages/Team';
import AdminBackup from './pages/AdminBackup';
import AdminDataManagement from './pages/AdminDataManagement';
import AdminHomeContent from './pages/AdminHomeContent';
import AdminDashboard from './pages/AdminDashboard';
import AdminRequestMonitor from './pages/AdminRequestMonitor';
import AdminGuard from './auth/AdminGuard';

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
              path="graph"
              element={<TemplateGraphPage />}
              errorElement={<ErrorFallback />}
            />
            <Route
              path="contribute"
              element={<ContributePage />}
              errorElement={<ErrorFallback />}
            />
            <Route
              path="contribute/viewer"
              element={<ContributeViewer />}
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

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

const Router = () => {
  return (
    <>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/templates/:templateId/" element={<Layout />}>
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
          </Route>

          <Route
            path="/"
            element={<Navigate to="/templates/empirical/" replace />}
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
};

export default Router;

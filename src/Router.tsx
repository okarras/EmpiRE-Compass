import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Statistics from './pages/Statistics';
import NotFound from './pages/NotFound';
import ErrorFallback from './pages/ErrorFallback';
import Layout from './pages/Layout';
import QuestionPage from './pages/QuestionPage';
import QuestionDashboardPage from './pages/QuestionDashboardPage';

const Router = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={<Home />}
          errorElement={<ErrorFallback />}
        />
        <Route
          path="/statistics"
          element={<Statistics />}
          errorElement={<ErrorFallback />}
        />
        <Route
          path="/questions/:id"
          element={<QuestionPage />}
          errorElement={<ErrorFallback />}
        />
        <Route
          path="allquestions"
          element={<QuestionDashboardPage />}
          errorElement={<ErrorFallback />}
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Router; 
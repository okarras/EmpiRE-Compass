import { BrowserRouter, Routes, Route } from 'react-router';
import Home from './pages/Home.tsx';
import Statistics from './pages/Statistics.tsx';
import NotFound from './pages/NotFound.tsx';
import ErrorFallback from './pages/ErrorFallback.tsx';
import Layout from './pages/Layout.tsx';

function App() {
  return (
    <>
      <BrowserRouter>
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
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;

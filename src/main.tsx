import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './main.css';
import AuthProvider from './auth/AuthProvider';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);

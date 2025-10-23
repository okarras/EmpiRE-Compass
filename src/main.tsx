import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './main.css';
import { pdfjs } from 'react-pdf';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
createRoot(document.getElementById('root')!).render(<App />);

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './main.css';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
createRoot(document.getElementById('root')!).render(<App />);

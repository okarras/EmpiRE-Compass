export const PDF_WORKER_SRC = '/assets/pdf.worker.min.mjs';

export async function ensureReactPdfWorkerConfigured(): Promise<void> {
  const { pdfjs } = await import('react-pdf');
  if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  }
}

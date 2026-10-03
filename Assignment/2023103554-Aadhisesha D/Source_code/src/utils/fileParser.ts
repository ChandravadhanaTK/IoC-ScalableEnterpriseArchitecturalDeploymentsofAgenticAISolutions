import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

let workerConfigured = false;

function configureWorker() {
  if (workerConfigured) return;
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  workerConfigured = true;
}

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Please keep the resume below 5 MB.');
  }

  if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
    return (await file.text()).trim();
  }

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Please upload a PDF or TXT resume.');
  }

  configureWorker();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const chunks: string[] = [];

  for (let page = 1; page <= pdf.numPages; page += 1) {
    const pageData = await pdf.getPage(page);
    const content = await pageData.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (pageText) chunks.push(pageText);
  }

  const text = chunks.join('\n\n');
  if (!text.trim()) {
    throw new Error('This PDF appears to be scanned/image-only. Upload a text-based PDF or paste the resume text manually.');
  }
  return text.trim();
}

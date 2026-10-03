import * as pdfjs from "pdfjs-dist";
import worker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = worker;
export async function extractPdfText(file: File, maxPages = 60) {
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let t = "";
  for (let i = 1; i <= Math.min(doc.numPages, maxPages); i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    t += c.items.map((it: any) => it.str).join(" ") + " ";
  }
  return t;
}

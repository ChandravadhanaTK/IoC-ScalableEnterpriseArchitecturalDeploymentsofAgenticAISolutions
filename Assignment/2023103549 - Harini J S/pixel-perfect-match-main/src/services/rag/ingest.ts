import { concepts } from "@/data/seed";
import type { Section } from "@/types/knowledge";

export const ACCEPTED = [".txt", ".md", ".markdown"];
const MAX_CHUNK = 700;

/** Split long paragraphs at sentence boundaries so each chunk stays citeable. */
function splitParagraph(p: string): string[] {
  if (p.length <= MAX_CHUNK) return [p];
  const sentences = p.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [p];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > MAX_CHUNK && cur) { out.push(cur.trim()); cur = ""; }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Text → sections (by markdown headings, else every 3 paragraphs) → chunks. */
export function ingestText(docId: string, raw: string): { title: string | undefined; sections: Section[] } {
  const lines = raw.replace(/\r/g, "").split("\n");
  const blocks: { heading?: string; paras: string[] }[] = [{ paras: [] }];
  let para: string[] = [];
  let title: string | undefined;
  const flush = () => { if (para.length) { blocks.at(-1)!.paras.push(para.join(" ").replace(/\s+/g, " ").trim()); para = []; } };
  for (const line of lines) {
    const h = line.match(/^#{1,3}\s+(.+)/);
    if (h) {
      flush();
      if (!title && line.startsWith("# ")) { title = h[1]!.trim(); continue; }
      blocks.push({ heading: h[1]!.trim(), paras: [] });
    } else if (!line.trim()) flush();
    else para.push(line.trim().replace(/^[-*]\s+/, "• "));
  }
  flush();
  let groups = blocks.filter((b) => b.paras.length);
  if (groups.length === 1 && !groups[0]!.heading && groups[0]!.paras.length > 3) {
    const ps = groups[0]!.paras;
    groups = [];
    for (let i = 0; i < ps.length; i += 3) groups.push({ heading: `Part ${i / 3 + 1}`, paras: ps.slice(i, i + 3) });
  }
  const sections = groups.map((g, si) => {
    const sid = `s${si + 1}`;
    const texts = g.paras.flatMap(splitParagraph);
    return { id: sid, title: g.heading ?? "Overview", chunks: texts.map((text, ci) => ({ id: `${docId}-${sid}-c${ci + 1}`, docId, sectionId: sid, text })) };
  });
  return { title, sections };
}

export function detectTags(raw: string): string[] {
  const lower = raw.toLowerCase();
  return concepts.filter((c) => [c.name, ...c.aliases].some((a) => lower.includes(a.toLowerCase()))).map((c) => c.name).slice(0, 6);
}

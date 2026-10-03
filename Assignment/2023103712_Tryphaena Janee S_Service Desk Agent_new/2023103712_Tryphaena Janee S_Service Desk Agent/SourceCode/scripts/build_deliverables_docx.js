// Builds docs/DELIVERABLES.docx from docs/DELIVERABLES.md so both stay in sync.
//   node scripts/build_deliverables_docx.js        (requires: npm i docx image-size)
// Supports the markdown used in that file: headings, paragraphs, bold, inline
// code, links, bullet/numbered lists, tables, images and fenced code blocks
// (mermaid blocks are skipped because each has a rendered PNG beside it).
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, ImageRun, AlignmentType, LevelFormat, TableOfContents, PageBreak,
  Footer, Header, PageNumber, TabStopType, ExternalHyperlink,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const DOCS = path.join(ROOT, "docs");
const md = fs.readFileSync(path.join(DOCS, "DELIVERABLES.md"), "utf8");

const FONT = "Calibri";
const MONO = "Consolas";
const NAVY = "16224A";
const ACCENT = "2F62D9";
const MUTED = "5B6684";
const PAGE_W = 11906, MARGIN = 1134; // A4, 2 cm margins
const CONTENT_W = PAGE_W - 2 * MARGIN; // DXA
const CONTENT_IN = CONTENT_W / 1440;

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function inline(text, base = {}) {
  const runs = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\([^)]+\)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    if (m[1] !== undefined) runs.push(...inline(m[1], { ...base, bold: true }));
    else if (m[2] !== undefined) runs.push(new TextRun({ text: m[2], font: MONO, size: (base.size || 21) - 2, color: "8A2D52", ...(base.bold ? { bold: true } : {}) }));
    else runs.push(new TextRun({ text: m[3], ...base, color: ACCENT }));
    last = re.lastIndex;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last), ...base }));
  return runs;
}

const border = { style: BorderStyle.SINGLE, size: 4, color: "C6CFE1" };
const borders = { top: border, bottom: border, left: border, right: border };

function table(rows) {
  const cells = rows.map((r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
  const header = cells[0];
  const body = cells.slice(2);
  const n = header.length;
  // Column widths proportional to content length, clamped.
  const lens = header.map((_, i) => Math.min(60, Math.max(13, ...cells.filter((_, k) => k !== 1).map((r) => (r[i] || "").length))));
  const sum = lens.reduce((a, b) => a + b, 0);
  const widths = lens.map((l) => Math.floor((l / sum) * CONTENT_W));
  // Give every column room for one short word (~1400 DXA), taking it from the widest column.
  for (let c = 0; c < n; c++) {
    if (widths[c] < 1400) {
      const widest = widths.indexOf(Math.max(...widths));
      widths[widest] -= 1400 - widths[c];
      widths[c] = 1400;
    }
  }
  widths[n - 1] += CONTENT_W - widths.reduce((a, b) => a + b, 0);
  const mk = (txt, i, isHead) => new TableCell({
    borders, width: { size: widths[i], type: WidthType.DXA },
    shading: isHead ? { fill: "E3ECFD", type: ShadingType.CLEAR, color: "auto" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: inline(txt, { size: 18, bold: isHead, font: FONT, color: isHead ? NAVY : undefined }) })],
  });
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: header.map((h, i) => mk(h, i, true)) }),
      ...body.map((r) => new TableRow({ children: header.map((_, i) => mk(r[i] || "", i, false)) })),
    ],
  });
}

function image(rel, maxHeightIn = 8.2) {
  const file = path.join(DOCS, rel);
  const { w, h } = pngSize(file);
  let wIn = CONTENT_IN, hIn = (h / w) * wIn;
  if (hIn > maxHeightIn) { hIn = maxHeightIn; wIn = (w / h) * hIn; }
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 120, after: 160 },
    children: [new ImageRun({ type: "png", data: fs.readFileSync(file),
      transformation: { width: Math.round(wIn * 96), height: Math.round(hIn * 96) },
      altText: { title: rel, description: rel, name: path.basename(rel) } })],
  });
}

const children = [];
// ---- cover ----
children.push(
  new Paragraph({ spacing: { before: 2600 }, children: [new TextRun({ text: "CAPSTONE DELIVERABLES", font: FONT, size: 22, bold: true, color: ACCENT, characterSpacing: 40 })] }),
  new Paragraph({ spacing: { before: 200, after: 120 }, children: [new TextRun({ text: "IT Service Desk Agent", font: FONT, size: 64, bold: true, color: NAVY })] }),
  new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: "Scalable Enterprise Architectural Deployments of Agentic AI Solutions", font: FONT, size: 26, color: MUTED })] }),
  ...[
    ["1", "Architecture Diagram", "Layers, components, trust boundaries and integrations"],
    ["2", "Agent Workflow Design", "Roles, states, tools, handoffs, approvals and failure paths"],
    ["3", "Deployment Strategy", "Runtime, scaling, resilience, environments and release"],
    ["4", "Security Model", "Identity, authorization, secrets, privacy, guardrails and audit"],
    ["5", "Monitoring Dashboard Design", "Health, trace, quality, safety, cost and business outcomes"],
  ].map(([n, t, d]) => new Paragraph({
    spacing: { after: 140 }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 8 } },
    children: [new TextRun({ text: `${n}  ${t}`, font: FONT, size: 24, bold: true, color: NAVY }),
      new TextRun({ text: `  ${d}`, font: FONT, size: 20, color: MUTED })],
  })),
  new Paragraph({ spacing: { before: 700 }, children: [new TextRun({ text: "Live demo: ", font: FONT, size: 22, bold: true, color: NAVY }),
    new ExternalHyperlink({ link: "https://service-desk-agent.netlify.app", children: [new TextRun({ text: "https://service-desk-agent.netlify.app", font: FONT, size: 22, color: ACCENT, underline: {} })] })] }),
  new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: `Version 1.0 · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, font: FONT, size: 20, color: MUTED })] }),
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Contents")] }),
  new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ children: [new PageBreak()] }),
);

// ---- body from markdown ----
const lines = md.split("\n");
let i = 0;
// skip the H1 title + subtitle + intro table (cover replaces them) up to the first '---'
while (i < lines.length && lines[i].trim() !== "---") i++;
i++;
let firstH2 = true;
const numberingRefs = [];
while (i < lines.length) {
  const line = lines[i];
  if (line.startsWith("```")) {
    const lang = line.slice(3).trim();
    const block = [];
    i++;
    while (i < lines.length && !lines[i].startsWith("```")) block.push(lines[i++]);
    i++;
    if (lang !== "mermaid") {
      block.forEach((b, k) => children.push(new Paragraph({
        shading: { fill: "F1F4FA", type: ShadingType.CLEAR, color: "auto" },
        spacing: { before: k === 0 ? 80 : 0, after: k === block.length - 1 ? 160 : 0 },
        children: [new TextRun({ text: b || " ", font: MONO, size: 17 })],
      })));
    }
    continue;
  }
  if (line.startsWith("|")) {
    const rows = [];
    while (i < lines.length && lines[i].startsWith("|")) rows.push(lines[i++]);
    children.push(table(rows), new Paragraph({ spacing: { after: 120 }, children: [] }));
    continue;
  }
  const img = line.match(/^!\[[^\]]*\]\(([^)]+)\)/);
  if (img) { children.push(image(img[1], img[1].includes("ui-") ? 4.2 : 8.4)); i++; continue; }
  if (line.startsWith("## ")) {
    if (!firstH2) children.push(new Paragraph({ children: [new PageBreak()] }));
    firstH2 = false;
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(line.slice(3).replace(/\*\*/g, ""))] }));
    i++; continue;
  }
  if (line.startsWith("### ")) { children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(line.slice(4))] })); i++; continue; }
  if (line.trim() === "---") { i++; continue; }
  if (/^\s*- /.test(line)) { children.push(new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: inline(line.replace(/^\s*- /, "")) })); i++; continue; }
  if (/^\d+\. /.test(line)) {
    // restart numbering per list
    const ref = `num-${i}`;
    numberingRefs.push(ref);
    while (i < lines.length && /^\d+\. /.test(lines[i])) {
      children.push(new Paragraph({ numbering: { reference: ref, level: 0 }, children: inline(lines[i].replace(/^\d+\. /, "")) }));
      i++;
    }
    continue;
  }
  if (line.trim() === "") { i++; continue; }
  children.push(new Paragraph({ spacing: { after: 120 }, children: inline(line) }));
  i++;
}


const doc = new Document({
  creator: "IT Service Desk Agent",
  title: "IT Service Desk Agent: Capstone Deliverables",
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 34, bold: true, color: NAVY, font: FONT }, paragraph: { spacing: { before: 120, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, color: ACCENT, font: FONT }, paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      ...numberingRefs.map((ref) => ({ reference: ref, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] })),
    ],
  },
  features: { updateFields: true },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "IT Service Desk Agent · Capstone Deliverables", size: 16, color: MUTED })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W }],
      children: [new TextRun({ text: "Scalable Enterprise Architectural Deployments of Agentic AI Solutions", size: 16, color: MUTED }),
        new TextRun({ children: ["\t", PageNumber.CURRENT], size: 16, color: MUTED })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(path.join(DOCS, "DELIVERABLES.docx"), buf);
  console.log("wrote docs/DELIVERABLES.docx");
});

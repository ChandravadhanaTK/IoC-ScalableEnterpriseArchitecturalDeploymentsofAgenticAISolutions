import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { categoryLabel, getDoc } from "@/data/seed";
import type { Category, Citation, KDocument } from "@/types/knowledge";
import { cn } from "@/lib/utils";

const catClass: Record<Category, string> = {
  research: "text-cat-research bg-cat-research/12 border-cat-research/30",
  academics: "text-cat-academics bg-cat-academics/12 border-cat-academics/30",
  programming: "text-cat-programming bg-cat-programming/12 border-cat-programming/30",
  devops: "text-cat-devops bg-cat-devops/12 border-cat-devops/30",
  aiml: "text-cat-aiml bg-cat-aiml/12 border-cat-aiml/30",
  projects: "text-cat-projects bg-cat-projects/12 border-cat-projects/30",
  personal: "text-cat-personal bg-cat-personal/12 border-cat-personal/30",
};
export const catDot: Record<Category, string> = {
  research: "bg-cat-research", academics: "bg-cat-academics", programming: "bg-cat-programming", devops: "bg-cat-devops",
  aiml: "bg-cat-aiml", projects: "bg-cat-projects", personal: "bg-cat-personal",
};

export function CategoryBadge({ c }: { c: Category }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", catClass[c])}>{categoryLabel[c]}</span>;
}

export function StatusBadge({ s }: { s: KDocument["status"] }) {
  const map = {
    ready: "text-success bg-success/12", processing: "text-warning bg-warning/12 animate-pulse",
    failed: "text-destructive bg-destructive/12", queued: "text-muted-foreground bg-muted",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", map[s])}>{s}</span>;
}

export function CitationChip({ c }: { c: Citation }) {
  const d = getDoc(c.docId);
  const sec = d?.sections.find((s) => s.id === c.sectionId);
  return (
    <span className="group relative inline-block align-baseline">
      <Link
        to="/app/documents/$id"
        params={{ id: c.docId }}
        search={{ sec: c.sectionId, chunk: c.chunkId }}
        className="mx-0.5 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-sans text-[11px] text-primary hover:bg-primary/20"
      >
        <FileText className="h-3 w-3" />
        <span className="font-mono">{c.n}</span>
        <span className="max-w-40 truncate">{d?.title} · §{sec?.title}</span>
      </Link>
      <span className="pointer-events-none invisible absolute bottom-full left-0 z-30 mb-2 w-80 rounded-xl border bg-popover p-3 text-xs leading-relaxed text-popover-foreground opacity-0 shadow-xl transition-opacity group-hover:visible group-hover:opacity-100">
        <span className="mb-1 block font-medium">{d?.title} · §{sec?.title}</span>
        <span className="block text-muted-foreground">{c.excerpt}</span>
      </span>
    </span>
  );
}

function inline(text: string, cites: Citation[]): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[\d+\])/g).map((p, i) => {
    if (p.startsWith("**")) return <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.length > 2) return <em key={i} className="text-foreground/90">{p.slice(1, -1)}</em>;
    const m = p.match(/^\[(\d+)\]$/);
    if (m) {
      const c = cites.find((x) => x.n === Number(m[1]));
      return c ? <CitationChip key={i} c={c} /> : null;
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}

/** Minimal markdown: paragraphs, bullet lists, bold/italic, and [n] citation chips. */
export function AnswerText({ text, citations }: { text: string; citations: Citation[] }) {
  const blocks = text.split(/\n\n+/);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
      {blocks.map((b, i) =>
        b.startsWith("- ") ? (
          <ul key={i} className="list-disc space-y-2 pl-5 marker:text-primary">
            {b.split("\n").map((l, j) => <li key={j}>{inline(l.replace(/^- /, ""), citations)}</li>)}
          </ul>
        ) : (
          <p key={i}>{inline(b, citations)}</p>
        ),
      )}
    </div>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export const btn = "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50";
export const btnPrimary = cn(btn, "bg-primary text-primary-foreground hover:bg-primary/90");
export const btnGhost = cn(btn, "border bg-card hover:bg-accent");

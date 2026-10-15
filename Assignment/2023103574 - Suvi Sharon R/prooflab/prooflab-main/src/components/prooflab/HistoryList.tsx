import { Trash2 } from "lucide-react";
import type { Analysis } from "@/lib/agent/types";

export function HistoryList({ items, onOpen, onDelete }: { items: Analysis[]; onOpen: (a: Analysis) => void; onDelete: (id: string) => void }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">No analyses yet. Your past reports will appear here (stored in this browser only).</p>;
  return (
    <ul className="divide-y rounded-md border bg-card">
      {items.map((a) => (
        <li key={a.id} className="flex items-center gap-3 px-4 py-3">
          <button type="button" onClick={() => onOpen(a)} className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium hover:text-signal">{a.results.understanding?.summary ?? a.idea}</p>
            <p className="label-mono mt-0.5">{new Date(a.createdAt).toLocaleString()}</p>
          </button>
          <button type="button" aria-label="Delete analysis" onClick={() => onDelete(a.id)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive">
            <Trash2 className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

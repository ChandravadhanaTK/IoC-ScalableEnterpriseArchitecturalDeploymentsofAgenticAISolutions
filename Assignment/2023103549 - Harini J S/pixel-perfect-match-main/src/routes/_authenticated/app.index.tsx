import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { CategoryBadge, StatusBadge, btnPrimary } from "@/components/kf/bits";
import { allChunks, collections, concepts, documents, relations } from "@/data/seed";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — KnowFlow" },
      { name: "description", content: "Your knowledge at a glance: documents, collections, concepts and recent activity." },
      { property: "og:title", content: "Dashboard — KnowFlow" },
      { property: "og:description", content: "Your knowledge at a glance: documents, collections, concepts and recent activity." },
    ],
  }),
  component: Dashboard,
});

const steps = ["Collect", "Organize", "Process", "Index", "Search", "Ask AI", "Understand", "Connect", "Discover"];

function Dashboard() {
  const stats = [
    ["Documents", documents.length],
    ["Chunks indexed", allChunks().length],
    ["Concepts", concepts.length],
    ["Relations", relations.length],
  ] as const;
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="card-surface hero-surface p-6 md:p-8">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Personal Knowledge Intelligence</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">Your documents, connected and answerable.</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">Every answer is grounded in your own chunks and cites the exact section it came from.</p>
        <ol className="mt-6 flex flex-wrap items-center gap-1.5 text-xs">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-1.5">
              <span className="rounded-full border bg-background/60 px-2.5 py-1"><span className="mr-1 font-mono text-muted-foreground">{i + 1}</span>{s}</span>
              {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/app/collections/$id" params={{ id: "distributed" }} className={btnPrimary}>Start the demo tour <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/app/assistant" className="inline-flex items-center gap-2 rounded-lg border bg-card px-3.5 py-2 text-sm hover:bg-accent">Ask your knowledge</Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([l, v]) => (
          <div key={l} className="card-surface p-4">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Collections</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {collections.map((c) => (
              <Link key={c.id} to="/app/collections/$id" params={{ id: c.id }} className="card-surface hover-lift p-4">
                <div className="flex items-center justify-between"><p className="font-medium">{c.name}</p><CategoryBadge c={c.category} /></div>
                <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                <p className="mt-3 text-xs text-muted-foreground">{documents.filter((d) => d.collectionId === c.id).length} documents</p>
              </Link>
            ))}
          </div>
        </section>
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Recently added</h2>
          <div className="card-surface divide-y">
            {[...documents].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 6).map((d) => (
              <Link key={d.id} to="/app/documents/$id" params={{ id: d.id }} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-accent/50">
                <div className="min-w-0"><p className="truncate text-sm font-medium">{d.title}</p><p className="text-xs text-muted-foreground">{d.addedAt}</p></div>
                <StatusBadge s={d.status} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

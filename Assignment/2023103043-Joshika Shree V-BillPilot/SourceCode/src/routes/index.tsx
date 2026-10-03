import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AGENT_ORDER } from "@/lib/agents";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BillPilot — Multi-Agent Bill & Subscription Manager" },
      { name: "description", content: "Upload a bill and six AI agents extract, classify, detect subscriptions, flag price jumps and set reminders." },
      { property: "og:title", content: "BillPilot — Multi-Agent Bill & Subscription Manager" },
      { property: "og:description", content: "Six specialized AI agents plus an orchestrator manage your bills and subscriptions." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-bold text-primary">BillPilot</span>
        <div className="flex gap-2">
          <Button variant="ghost" asChild><Link to="/login">Log in</Link></Button>
          <Button asChild><Link to="/signup">Create account</Link></Button>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-4 inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Final-year CSE capstone · Multi-agent AI</p>
          <h1 className="text-5xl font-bold leading-tight text-foreground md:text-6xl">Subscription & Bill Manager <span className="text-primary">AI</span></h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">Upload a bill. An orchestrator runs six specialized agents that extract details, classify spend, detect subscriptions, flag unusual price changes and schedule reminders — with you reviewing anything uncertain.</p>
          <div className="mt-8 flex gap-3">
            <Button size="lg" asChild><Link to="/signup">Get started</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/login">I have an account</Link></Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">No payments, no bank access, no financial advice — just organised bills.</p>
        </div>
        <ol className="space-y-3 rounded-2xl border bg-card p-6 shadow-sm">
          <li className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Orchestrated pipeline</li>
          {AGENT_ORDER.map((a, i) => (
            <li key={a} className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
              <span className="font-medium">{a}</span>
            </li>
          ))}
          <li className="flex items-center gap-3 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">Human-in-the-loop review when confidence &lt; 80%</li>
        </ol>
      </main>
    </div>
  );
}

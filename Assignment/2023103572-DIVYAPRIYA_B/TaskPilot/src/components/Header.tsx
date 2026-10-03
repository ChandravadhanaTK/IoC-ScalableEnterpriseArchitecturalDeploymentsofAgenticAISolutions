import { Bot } from "lucide-react";

export function Header({ status }: { status: string }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">TaskPilot</h1>
            <p className="text-sm text-muted-foreground">Your lightweight Agentic AI Task Planner</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium sm:flex">
          <span className={`h-2 w-2 rounded-full ${status === "Working" ? "animate-pulse bg-warning" : "bg-success"}`} />
          Agent: {status}
        </div>
      </div>
    </header>
  );
}

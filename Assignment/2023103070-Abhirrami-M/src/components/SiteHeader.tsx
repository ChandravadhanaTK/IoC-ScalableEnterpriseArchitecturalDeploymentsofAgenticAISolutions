import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Research" },
  { to: "/agent-workflow", label: "Agent Workflow" },
  { to: "/capstone-deliverables", label: "Capstone Deliverables" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link to="/" className="font-serif text-xl font-semibold text-primary">
          ResearchMate
        </Link>
        <nav className="flex flex-wrap gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" }}
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t py-6 text-center text-xs text-muted-foreground">
      ResearchMate · IoC Capstone · Paper data from OpenAlex (openalex.org)
    </footer>
  );
}

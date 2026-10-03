import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-mono text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="mt-6 inline-flex rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end. You can try refreshing or head back home.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
          <a href="/" className="rounded-sm border border-border px-4 py-2 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PlacePilot AI — Agentic Placement Intelligence" },
      { name: "description", content: "Agentic AI placement intelligence and preparation for Indian engineering students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV = [
  { group: "Student", items: [["/", "Flight Deck"], ["/opportunities", "Opportunities"], ["/opportunities/new", "Ingest Notification"], ["/profile", "My Profile"]] },
  { group: "Course Deliverables", items: [["/architecture", "Architecture"], ["/architecture/agents", "Agent Workflow"], ["/architecture/deployment", "Deployment"], ["/architecture/security", "Security Model"], ["/monitoring", "Monitoring"], ["/monitoring/traces", "Trace Inspector"]] },
] as const;

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen md:flex">
        <aside className="border-b border-sidebar-border bg-sidebar md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
          <Link to="/" className="flex items-center gap-2 px-5 py-5">
            <span className="grid h-8 w-8 place-items-center rounded-sm bg-primary font-mono text-sm font-bold text-primary-foreground">PP</span>
            <span className="leading-tight">
              <span className="block font-semibold">PlacePilot AI</span>
              <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Placement Intel</span>
            </span>
          </Link>
          <nav className="flex gap-4 overflow-x-auto px-3 pb-3 md:block md:space-y-5 md:overflow-visible">
            {NAV.map((g) => (
              <div key={g.group} className="flex gap-1 md:block md:space-y-0.5">
                <p className="hidden px-2 pb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground md:block">{g.group}</p>
                {g.items.map(([to, label]) => (
                  <Link key={to} to={to} activeOptions={{ exact: true }} className="block whitespace-nowrap rounded-sm px-2 py-1.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent" activeProps={{ className: "!bg-sidebar-accent !text-primary" }}>
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-8 md:px-10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}

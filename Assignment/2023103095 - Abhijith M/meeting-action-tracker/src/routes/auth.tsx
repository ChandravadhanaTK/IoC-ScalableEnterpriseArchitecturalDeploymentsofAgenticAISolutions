import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AI Meeting Action Tracker" },
      { name: "description", content: "Sign in to the agentic AI meeting action tracker." },
      { property: "og:title", content: "Sign in — AI Meeting Action Tracker" },
      { property: "og:description", content: "Sign in to the agentic AI meeting action tracker." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user) navigate({ to: "/" }); }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error, data } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (mode === "up" && !data.session) toast.success("Check your email to confirm your account.");
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error(r.error.message ?? "Google sign-in failed");
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-shell p-10 text-shell-foreground md:flex">
        <div className="font-mono text-xs tracking-[0.16em] text-shell-muted">IOC · SCALABLE ENTERPRISE AGENTIC AI</div>
        <div>
          <h1 className="text-3xl font-semibold leading-tight">AI Meeting Action Tracker</h1>
          <p className="mt-3 max-w-md text-shell-muted">Transcripts in, accountable tasks out — with three orchestrated agents and a human approval gate.</p>
          <ol className="mt-8 space-y-2 font-mono text-xs text-shell-muted">
            {["Meeting Analysis Agent", "Human Review / Approval", "Task Management Agent", "Reminder Agent", "Notifications"].map((s, i) => (
              <li key={s} className="flex items-center gap-3"><span className="text-shell-foreground">0{i + 1}</span>{s}</li>
            ))}
          </ol>
        </div>
        <div className="text-xs text-shell-muted">Academic demonstration</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{mode === "in" ? "Sign in" : "Create account"}</h2>
            <p className="text-sm text-muted-foreground">Access is scoped to your own meetings and tasks.</p>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
          <div className="eyebrow text-center">or</div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Password</Label><Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}</Button>
          <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "No account? Sign up" : "Have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

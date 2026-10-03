import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BrainCircuit } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { btnGhost, btnPrimary } from "@/components/kf/bits";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { ensureDemoAccount } from "@/lib/demo.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — KnowFlow" },
      { name: "description", content: "Sign in to your KnowFlow knowledge workspace." },
      { property: "og:title", content: "Sign in — KnowFlow" },
      { property: "og:description", content: "Sign in to your KnowFlow knowledge workspace." },
    ],
  }),
  component: AuthPage,
});

const safe = (r?: string) => (r && r.startsWith("/") && !r.startsWith("//") ? r : "/app");

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const demo = useServerFn(ensureDemoAccount);
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const go = () => navigate({ to: safe(redirect) as "/app" });
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) go(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        go();
      } else if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/app" } });
        if (error) throw error;
        setMsg({ ok: true, text: "Check your email to confirm your account, then sign in." });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        setMsg({ ok: true, text: "If that email exists, a reset link is on its way." });
      }
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" });
    } finally { setBusy(false); }
  }

  async function useDemo(kind: "demo" | "admin") {
    setBusy(true); setMsg(null);
    try {
      const creds = await demo({ data: { kind } });
      setEmail(creds.email); setPassword(creds.password);
      const { error } = await supabase.auth.signInWithPassword(creds);
      if (error) throw error;
      go();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Demo sign-in failed" });
    } finally { setBusy(false); }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) return setMsg({ ok: false, text: r.error.message ?? "Google sign-in failed" });
    if (r.redirected) return;
    go();
  }

  const input = "w-full rounded-lg border bg-background px-3 py-2.5 text-sm";
  return (
    <div className="hero-surface flex min-h-screen items-center justify-center px-4">
      <div className="card-surface w-full max-w-sm p-7">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary"><BrainCircuit className="h-5 w-5" /></span>
          <span className="text-lg font-semibold">KnowFlow</span>
        </div>
        <h1 className="text-xl font-semibold">{mode === "in" ? "Welcome back" : mode === "up" ? "Create your account" : "Reset password"}</h1>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          {mode !== "forgot" && <input type="password" required minLength={8} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />}
          <button disabled={busy} className={cn(btnPrimary, "w-full justify-center")}>{mode === "in" ? "Sign in" : mode === "up" ? "Sign up" : "Send reset link"}</button>
        </form>
        {mode !== "forgot" && <button onClick={google} className={cn(btnGhost, "mt-3 w-full justify-center")}>Continue with Google</button>}
        {msg && <p className={cn("mt-3 text-sm", msg.ok ? "text-success" : "text-destructive")}>{msg.text}</p>}
        <div className="mt-4 flex justify-between text-xs text-muted-foreground">
          <button onClick={() => setMode(mode === "up" ? "in" : "up")} className="hover:text-foreground">{mode === "up" ? "Have an account? Sign in" : "Create account"}</button>
          <button onClick={() => setMode(mode === "forgot" ? "in" : "forgot")} className="hover:text-foreground">{mode === "forgot" ? "Back to sign in" : "Forgot password?"}</button>
        </div>
        <div className="mt-6 rounded-xl border bg-background/60 p-4">
          <p className="text-sm font-medium">Try the demo</p>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">demo@knowflow.app / KnowFlow-Demo-2026!<br />admin@knowflow.app / KnowFlow-Admin-2026!</p>
          <div className="mt-3 flex gap-2">
            <button disabled={busy} onClick={() => useDemo("demo")} className={cn(btnPrimary, "flex-1 justify-center py-1.5 text-xs")}>Use demo account</button>
            <button disabled={busy} onClick={() => useDemo("admin")} className={cn(btnGhost, "flex-1 justify-center py-1.5 text-xs")}>Admin demo</button>
          </div>
        </div>
      </div>
    </div>
  );
}

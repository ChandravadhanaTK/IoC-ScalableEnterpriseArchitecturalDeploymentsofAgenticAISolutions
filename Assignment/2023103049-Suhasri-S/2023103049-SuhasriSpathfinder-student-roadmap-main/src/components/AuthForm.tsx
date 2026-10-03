import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "./AppShell";

async function goAfterAuth(navigate: ReturnType<typeof useNavigate>) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { data } = await supabase.from("profiles").select("assessment_completed").eq("id", u.user.id).maybeSingle();
  navigate({ to: data?.assessment_completed ? "/dashboard" : "/assessment" });
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) return void toast.error("Password must be at least 8 characters.");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: window.location.origin + "/assessment" },
        });
        if (error) throw error;
        if (data.user && data.user.identities?.length === 0) throw new Error("An account with this email already exists. Please sign in.");
        if (!data.session) { setInfo("Check your inbox to confirm your email, then sign in."); return; }
        navigate({ to: "/assessment" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await goAfterAuth(navigate);
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "";
      toast.error(
        /invalid login/i.test(m) ? "Incorrect email or password." :
        /not confirmed/i.test(m) ? "Please confirm your email first — check your inbox." :
        /already|registered/i.test(m) ? "An account with this email already exists. Please sign in." :
        /fetch|network/i.test(m) ? "Network problem — please try again." : m || "Authentication failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/login" });
    if (r.error) return void toast.error("Google sign-in failed. Please try again.");
    if (r.redirected) return;
    await goAfterAuth(navigate);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-trail p-12 text-primary-foreground lg:flex">
        <Link to="/"><Logo /></Link>
        <div>
          <h2 className="text-4xl font-bold leading-tight">A roadmap that listens<br />when you struggle.</h2>
          <p className="mt-4 max-w-sm text-primary-foreground/80">Agents analyze, plan, watch your progress and propose changes — you approve every one.</p>
        </div>
        <span className="text-sm text-primary-foreground/60">Human-in-the-loop career planning</span>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden"><Logo className="mb-8" /></Link>
          <h1 className="text-3xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-muted-foreground">{mode === "login" ? "Pick up where you left off." : "It takes about 3 minutes to get your roadmap."}</p>
          {info ? (
            <div className="mt-8 rounded-xl border bg-card p-5 text-sm">{info} <Link to="/login" className="font-semibold text-primary underline">Sign in</Link></div>
          ) : (
            <>
              <Button type="button" variant="outline" className="mt-8 w-full" onClick={google}>Continue with Google</Button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
              <form onSubmit={submit} className="space-y-4">
                {mode === "signup" && (
                  <div><Label htmlFor="name">Full name</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
                )}
                <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label htmlFor="password">Password</Label><Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "login" ? <>New here? <Link to="/signup" className="font-semibold text-primary">Create an account</Link></> : <>Already have an account? <Link to="/login" className="font-semibold text-primary">Sign in</Link></>}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [
    { title: "Log in — BillPilot" }, { name: "description", content: "Log in to manage your bills and subscriptions." },
    { property: "og:title", content: "Log in — BillPilot" }, { property: "og:description", content: "Log in to BillPilot." },
  ] }),
  component: Login,
});

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
        <Link to="/" className="font-display text-lg font-bold text-primary">BillPilot</Link>
        <h1 className="mt-4 mb-6 text-2xl font-bold">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    nav({ to: "/dashboard" });
  };
  const forgot = async () => {
    if (!email) { toast.error("Enter your email first"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    error ? toast.error(error.message) : toast.success("Password reset email sent");
  };
  return (
    <AuthShell title="Welcome back">
      <form onSubmit={submit} className="space-y-4">
        <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <Button className="w-full" disabled={busy}>{busy ? "Logging in…" : "Login"}</Button>
        <div className="flex justify-between text-sm">
          <Link to="/signup" className="text-primary hover:underline">Create Account</Link>
          <button type="button" onClick={forgot} className="text-muted-foreground hover:underline">Forgot Password</button>
        </div>
      </form>
    </AuthShell>
  );
}

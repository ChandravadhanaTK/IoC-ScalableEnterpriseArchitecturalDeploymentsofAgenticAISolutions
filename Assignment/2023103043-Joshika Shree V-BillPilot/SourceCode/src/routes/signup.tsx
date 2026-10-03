import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [
    { title: "Create account — BillPilot" }, { name: "description", content: "Create a BillPilot account." },
    { property: "og:title", content: "Create account — BillPilot" }, { property: "og:description", content: "Start managing bills with AI agents." },
  ] }),
  component: Signup,
});

function Signup() {
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (f.password !== f.confirm) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: f.email, password: f.password,
      options: { data: { name: f.name }, emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  };
  if (sent) return <AuthShell title="Check your email"><p className="text-muted-foreground">We sent a confirmation link to {f.email}. Click it, then log in.</p><Button asChild className="mt-6 w-full"><Link to="/login">Go to login</Link></Button></AuthShell>;
  const field = (k: keyof typeof f, label: string, type = "text") => (
    <div><Label htmlFor={k}>{label}</Label><Input id={k} type={type} required value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  );
  return (
    <AuthShell title="Create your account">
      <form onSubmit={submit} className="space-y-4">
        {field("name", "Name")}{field("email", "Email", "email")}{field("password", "Password", "password")}{field("confirm", "Confirm Password", "password")}
        <Button className="w-full" disabled={busy}>{busy ? "Creating…" : "Create Account"}</Button>
        <p className="text-center text-sm text-muted-foreground">Have an account? <Link to="/login" className="text-primary hover:underline">Login</Link></p>
      </form>
    </AuthShell>
  );
}

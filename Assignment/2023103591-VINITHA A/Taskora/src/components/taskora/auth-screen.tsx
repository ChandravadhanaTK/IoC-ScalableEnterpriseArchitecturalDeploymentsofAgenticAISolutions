import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "login" | "signup" | "forgot" | "reset";

export function AuthScreen({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        await navigate({ to: "/" });
      } else if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: window.location.origin } });
        if (authError) throw authError;
        if (data.user && data.session) {
          await supabase.from("profiles").upsert({ id: data.user.id, full_name: name, email });
          await navigate({ to: "/" });
        } else setMessage("Check your inbox to confirm your email, then sign in.");
      } else if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (authError) throw authError;
        setMessage("If an account exists, a reset link is on its way.");
      } else {
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setMessage("Password updated. You can return to your workspace.");
      }
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Something went wrong."); }
    finally { setBusy(false); }
  }

  async function google() {
    setBusy(true); setError("");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { setError(result.error.message); setBusy(false); return; }
    if (!result.redirected) await navigate({ to: "/" });
  }

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Create your workspace" : mode === "forgot" ? "Reset your password" : "Choose a new password";
  const subtitle = mode === "login" ? "Sign in to continue planning your best work." : mode === "signup" ? "A focused workspace, private to you." : mode === "forgot" ? "We’ll email you a secure reset link." : "Use at least eight characters.";

  return <main className="auth-layout">
    <section className="auth-story" aria-label="Taskora introduction">
      <div className="brand-lockup"><span className="brand-mark"><BookOpen /></span><span>Taskora</span></div>
      <div className="auth-quote"><p>Plan the work.<br/>Protect the focus.<br/>See the progress.</p><span>One calm place for every study day.</span></div>
      <div className="auth-proof"><CheckCircle2/> Your work stays private to your account</div>
    </section>
    <section className="auth-panel">
      <div className="auth-card">
        <div><p className="eyebrow">Student productivity hub</p><h1>{title}</h1><p className="subtle">{subtitle}</p></div>
        {message ? <div className="success-message" role="status">{message}</div> : null}
        {error ? <div className="error-message" role="alert">{error}</div> : null}
        <form onSubmit={submit} className="auth-form">
          {mode === "signup" ? <div><Label htmlFor="name">Full name</Label><Input id="name" value={name} onChange={(e)=>setName(e.target.value)} required placeholder="Aarav Sharma" /></div> : null}
          {mode !== "reset" ? <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required placeholder="you@university.edu" /></div> : null}
          {mode === "login" || mode === "signup" || mode === "reset" ? <div><div className="label-row"><Label htmlFor="password">Password</Label>{mode === "login" ? <Link to="/forgot-password">Forgot password?</Link> : null}</div><div className="password-field"><Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={8} /><Button type="button" variant="ghost" size="icon" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff/> : <Eye/>}</Button></div></div> : null}
          <Button className="w-full" size="lg" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Update password"}</Button>
        </form>
        {mode === "login" || mode === "signup" ? <><div className="divider"><span>or</span></div><Button variant="outline" size="lg" className="w-full" onClick={google} disabled={busy}><span className="google-g">G</span> Continue with Google</Button></> : null}
        <p className="auth-switch">{mode === "login" ? <>New to Taskora? <Link to="/signup">Create an account</Link></> : mode === "signup" ? <>Already have an account? <Link to="/login">Sign in</Link></> : <>Remembered it? <Link to="/login">Back to sign in</Link></>}</p>
      </div>
    </section>
  </main>;
}

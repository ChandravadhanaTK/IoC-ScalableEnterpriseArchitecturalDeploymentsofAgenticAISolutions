import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
export default function Login() {
  const [p] = useSearchParams(); const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "reset">(p.get("mode") === "signup" ? "signup" : "login");
  const [f, setF] = useState({ email: "", password: "", full_name: "", username: "" }); const [msg, setMsg] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  async function submit(e: FormEvent) {
    e.preventDefault(); setMsg("");
    if (mode === "reset") { const r = await supabase.auth.resetPasswordForEmail(f.email, { redirectTo: location.origin + "/login" }); return setMsg(r.error?.message ?? "Reset link sent."); }
    const r = mode === "signup" ? await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.full_name, username: f.username } } }) : await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
    if (r.error) return setMsg(r.error.message);
    if (r.data.session) nav("/dashboard"); else setMsg("Check your email to confirm your account.");
  }
  return (<div className="mx-auto max-w-md px-6 py-16"><form onSubmit={submit} className="card up space-y-4">
    <h1 className="text-2xl font-bold">{mode === "signup" ? "Create account" : mode === "reset" ? "Reset password" : "Login"}</h1>
    {mode === "signup" && <><input className="input" placeholder="Full name" onChange={set("full_name")} required /><input className="input" placeholder="Username" onChange={set("username")} required /></>}
    <input className="input" type="email" placeholder="Email" onChange={set("email")} required />
    {mode !== "reset" && <input className="input" type="password" placeholder="Password" onChange={set("password")} required minLength={6} />}
    {msg && <p className="text-warn text-sm">{msg}</p>}
    <button className="btn w-full">{mode === "reset" ? "Send reset link" : mode === "signup" ? "Sign up" : "Login"}</button>
    <div className="text-muted flex justify-between text-sm"><button type="button" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "Have an account?" : "Create account"}</button><button type="button" onClick={() => setMode("reset")}>Forgot password?</button></div></form></div>);
}

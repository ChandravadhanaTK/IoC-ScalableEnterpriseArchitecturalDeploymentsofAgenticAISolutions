import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChefHat } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — CHEFSTATION" },
      { name: "description", content: "Sign in to CHEFSTATION to track orders, manage reservations, or access staff tools." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="surface-card w-full max-w-md p-8 animate-scale-in">
        <div className="mb-8 text-center">
          <ChefHat className="mx-auto h-10 w-10 text-primary" />
          <h1 className="font-display mt-4 text-3xl font-black text-gold-gradient">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your CHEFSTATION account</p>
        </div>
        <form onSubmit={signIn} className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="you@example.com" />
          </div>
          <div>
            <Label className="text-muted-foreground">Password</Label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="••••••••" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary py-5 font-bold text-primary-foreground btn-glow">
            {loading ? "Signing in…" : "Sign In"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <Link to="/" className="text-muted-foreground hover:text-primary">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}

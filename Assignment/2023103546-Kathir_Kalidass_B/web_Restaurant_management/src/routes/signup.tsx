import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChefHat } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Gluten-Free", "Jain", "Nut-Free", "Dairy-Free"];

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account — CHEFSTATION" },
      { name: "description", content: "Join CHEFSTATION to order faster, earn loyalty points, and manage reservations." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = (d: string) =>
    setDietary((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created! Check your email to verify, then sign in.");
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="surface-card w-full max-w-md p-8 animate-scale-in">
        <div className="mb-8 text-center">
          <ChefHat className="mx-auto h-10 w-10 text-primary" />
          <h1 className="font-display mt-4 text-3xl font-black text-gold-gradient">Join CHEFSTATION</h1>
          <p className="mt-2 text-sm text-muted-foreground">Earn loyalty points from your very first order</p>
        </div>
        <form onSubmit={signUp} className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Full Name</Label>
            <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="Your name" />
          </div>
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="you@example.com" />
          </div>
          <div>
            <Label className="text-muted-foreground">Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="+91 …" />
          </div>
          <div>
            <Label className="text-muted-foreground">Password</Label>
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="Min. 6 characters" />
          </div>
          <div>
            <Label className="text-muted-foreground">Dietary preferences (optional)</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => toggle(d)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    dietary.includes(d) ? "border-success/60 bg-success/15 text-success" : "border-border bg-card-alt text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary py-5 font-bold text-primary-foreground btn-glow">
            {loading ? "Creating…" : "Create Account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { btnPrimary } from "@/components/kf/bits";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — KnowFlow" },
      { name: "description", content: "Choose a new password for your KnowFlow account." },
      { property: "og:title", content: "Set a new password — KnowFlow" },
      { property: "og:description", content: "Choose a new password for your KnowFlow account." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setErr(error.message);
    navigate({ to: "/app" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="card-surface w-full max-w-sm space-y-3 p-7">
        <h1 className="text-xl font-semibold">Set a new password</h1>
        <input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
        <button className={cn(btnPrimary, "w-full justify-center")}>Update password</button>
        {err && <p className="text-sm text-destructive">{err}</p>}
      </form>
    </div>
  );
}

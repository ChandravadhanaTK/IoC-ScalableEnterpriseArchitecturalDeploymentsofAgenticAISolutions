import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "./login";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Reset password — BillPilot" }, { name: "description", content: "Set a new BillPilot password." },
    { property: "og:title", content: "Reset password — BillPilot" }, { property: "og:description", content: "Set a new password." },
  ] }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const nav = useNavigate();
  return (
    <AuthShell title="Set a new password">
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        const { error } = await supabase.auth.updateUser({ password: pw });
        if (error) { toast.error(error.message); return; }
        toast.success("Password updated"); nav({ to: "/dashboard" });
      }}>
        <Input type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" />
        <Button className="w-full">Update password</Button>
      </form>
    </AuthShell>
  );
}

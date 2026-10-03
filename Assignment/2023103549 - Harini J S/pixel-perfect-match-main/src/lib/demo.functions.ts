import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Fixed, publicly documented demo accounts. Only these two can be provisioned here. */
const DEMO = {
  demo: { email: "demo@knowflow.app", password: "KnowFlow-Demo-2026!", admin: false },
  admin: { email: "admin@knowflow.app", password: "KnowFlow-Admin-2026!", admin: true },
} as const;

export const ensureDemoAccount = createServerFn({ method: "POST" })
  .validator((d) => z.object({ kind: z.enum(["demo", "admin"]) }).parse(d))
  .handler(async ({ data }) => {
    const acct = DEMO[data.kind];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const created = await supabaseAdmin.auth.admin.createUser({
      email: acct.email,
      password: acct.password,
      email_confirm: true,
      user_metadata: { display_name: data.kind === "admin" ? "Admin" : "Demo User" },
    });
    if (created.error) console.error("demo createUser:", created.error.message);
    let userId = created.data.user?.id;
    if (!userId) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
      userId = list?.users.find((u) => u.email === acct.email)?.id;
    }
    if (userId && acct.admin) {
      await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    }
    return { email: acct.email, password: acct.password };
  });

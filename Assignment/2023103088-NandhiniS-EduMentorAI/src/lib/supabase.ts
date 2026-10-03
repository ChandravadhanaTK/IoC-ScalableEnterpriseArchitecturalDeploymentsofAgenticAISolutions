import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL ?? "http://localhost", import.meta.env.VITE_SUPABASE_ANON_KEY ?? "missing");
export type Role = "admin" | "student";

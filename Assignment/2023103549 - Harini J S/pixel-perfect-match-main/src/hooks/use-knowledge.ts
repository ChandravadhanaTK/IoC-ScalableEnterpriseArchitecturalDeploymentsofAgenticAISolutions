import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Category, Collection } from "@/types/knowledge";
import { collections as seedCollections, documents } from "@/data/seed";

export interface UserCollection extends Collection { docIds: string[]; custom: true }
export type AnyCollection = (Collection & { docIds: string[]; custom?: false }) | UserCollection;

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async (): Promise<AnyCollection[]> => {
      const { data, error } = await supabase.from("collections").select("*").order("created_at");
      if (error) throw error;
      const seed = seedCollections.map((c) => ({ ...c, docIds: documents.filter((d) => d.collectionId === c.id).map((d) => d.id), custom: false as const }));
      const mine = (data ?? []).map((r) => ({ id: r.id, name: r.name, description: r.description, category: r.category as Category, docIds: r.doc_ids, custom: true as const }));
      return [...seed, ...mine];
    },
  });
}

export function useCollectionMutations() {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ["collections"] });
  const create = useMutation({
    mutationFn: async (v: { name: string; description: string; docIds: string[] }) => {
      const { data, error } = await supabase.from("collections").insert({ name: v.name, description: v.description, doc_ids: v.docIds }).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: done,
  });
  const update = useMutation({
    mutationFn: async (v: { id: string; name?: string; description?: string; docIds?: string[] }) => {
      const patch: { name?: string; description?: string; doc_ids?: string[] } = {};
      if (v.name !== undefined) patch.name = v.name;
      if (v.description !== undefined) patch.description = v.description;
      if (v.docIds !== undefined) patch.doc_ids = v.docIds;
      const { error } = await supabase.from("collections").update(patch).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: done,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: done,
  });
  return { create, update, remove };
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("conversations").select("id,title,updated_at").order("updated_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      return !!data;
    },
  });
}

// ---- Favorites, notes, activity ----

export function logActivity(kind: "view" | "note" | "favorite" | "upload" | "ask" | "collection", label: string, docId?: string) {
  void supabase.from("activity").insert({ kind, label, doc_id: docId ?? null }).then(() => undefined);
}

export function useFavorites() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("doc_id,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => r.doc_id);
    },
  });
  const toggle = useMutation({
    mutationFn: async (v: { docId: string; title: string }) => {
      const on = q.data?.includes(v.docId);
      if (on) {
        const { error } = await supabase.from("favorites").delete().eq("doc_id", v.docId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("favorites").insert({ doc_id: v.docId });
        if (error) throw error;
        logActivity("favorite", `Starred ${v.title}`, v.docId);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["favorites"] }); qc.invalidateQueries({ queryKey: ["activity"] }); },
  });
  return { ids: q.data ?? [], toggle };
}

export interface Note { id: string; doc_id: string; chunk_id: string | null; quote: string; body: string; created_at: string }

export function useNotes(docId?: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["notes", docId ?? "all"],
    queryFn: async (): Promise<Note[]> => {
      let req = supabase.from("notes").select("*").order("created_at", { ascending: false });
      if (docId) req = req.eq("doc_id", docId);
      const { data, error } = await req;
      if (error) throw error;
      return data ?? [];
    },
  });
  const done = () => { qc.invalidateQueries({ queryKey: ["notes"] }); qc.invalidateQueries({ queryKey: ["activity"] }); };
  const add = useMutation({
    mutationFn: async (v: { docId: string; title: string; chunkId?: string | undefined; quote?: string | undefined; body: string }) => {
      const { error } = await supabase.from("notes").insert({ doc_id: v.docId, chunk_id: v.chunkId ?? null, quote: v.quote ?? "", body: v.body });
      if (error) throw error;
      logActivity("note", `Added a note on ${v.title}`, v.docId);
    },
    onSuccess: done,
  });
  const update = useMutation({
    mutationFn: async (v: { id: string; body: string }) => {
      const { error } = await supabase.from("notes").update({ body: v.body }).eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: done,
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: done,
  });
  return { notes: q.data ?? [], isLoading: q.isLoading, add, update, remove };
}

export function useActivity(limit = 40) {
  return useQuery({
    queryKey: ["activity", limit],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity").select("*").order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

import { queryOptions } from "@tanstack/react-query";
import { setUserDocs } from "@/data/seed";
import { supabase } from "@/integrations/supabase/client";
import type { Category, KDocument, Section } from "@/types/knowledge";

/** Loads the user's uploaded documents and registers them into the shared corpus. */
export const userDocsQuery = queryOptions({
  queryKey: ["user-docs"],
  queryFn: async (): Promise<KDocument[]> => {
    const { data, error } = await supabase.from("user_documents").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    const docs: KDocument[] = (data ?? []).map((r) => ({
      id: r.id, title: r.title, category: r.category as Category, collectionId: "uploads", author: r.author,
      addedAt: r.created_at.slice(0, 10), status: r.status as KDocument["status"], tags: r.tags,
      sections: (r.sections as unknown as Section[]) ?? [], owned: true, error: r.error,
    }));
    setUserDocs(docs);
    return docs;
  },
});

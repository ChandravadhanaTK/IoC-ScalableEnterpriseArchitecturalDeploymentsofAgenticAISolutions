import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { dishImage } from "@/lib/dish-images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/menu")({
  head: () => ({ meta: [{ title: "Menu — CHEFSTATION Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminMenu,
});

function AdminMenu() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [spice, setSpice] = useState(0);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const { data: items } = useQuery({
    queryKey: ["admin-menu-items"],
    queryFn: async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("*, categories(name)")
        .is("deleted_at", null)
        .order("sort_order");
      return data ?? [];
    },
  });

  const toggle = async (id: string, field: "is_available" | "is_bestseller" | "is_featured", value: boolean) => {
    const { error } = await supabase.from("menu_items").update({ [field]: value }).eq("id", id);
    if (error) toast.error(error.message);
    else queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] });
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("menu_items").insert({
      name,
      description: description || null,
      price: Number(price),
      category_id: categoryId || null,
      spice_level: spice,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${name} added to the menu`);
    setOpen(false);
    setName(""); setDescription(""); setPrice(""); setSpice(0);
    queryClient.invalidateQueries({ queryKey: ["admin-menu-items"] });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gold-gradient">Menu Items</h1>
        <Button className="bg-primary font-bold text-primary-foreground" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="surface-card mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-center">Available</th>
              <th className="px-4 py-3 text-center">Bestseller</th>
              <th className="px-4 py-3 text-center">Featured</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((i) => {
              const img = dishImage(i.name);
              return (
                <tr key={i.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {img ? (
                        <img src={img} alt={i.name} className="h-9 w-9 rounded-md object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 font-display text-sm font-bold text-primary">
                          {i.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-foreground">{i.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{i.categories?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">{formatINR(i.price)}</td>
                  <td className="px-4 py-3 text-center">
                    <Switch checked={i.is_available} onCheckedChange={(v) => toggle(i.id, "is_available", v)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch checked={i.is_bestseller} onCheckedChange={(v) => toggle(i.id, "is_bestseller", v)} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch checked={i.is_featured} onCheckedChange={(v) => toggle(i.id, "is_featured", v)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-foreground"><Star className="h-4 w-4 text-primary" /> Add Menu Item</DialogTitle></DialogHeader>
          <form onSubmit={addItem} className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 border-input bg-input-bg" />
            </div>
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 border-input bg-input-bg" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Price (₹)</Label>
                <Input required type="number" min={1} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 border-input bg-input-bg" />
              </div>
              <div>
                <Label className="text-muted-foreground">Spice level (0–3)</Label>
                <Input type="number" min={0} max={3} value={spice} onChange={(e) => setSpice(Number(e.target.value))} className="mt-1 border-input bg-input-bg" />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="mt-1 border-input bg-input-bg"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-primary font-bold text-primary-foreground">Add Item</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

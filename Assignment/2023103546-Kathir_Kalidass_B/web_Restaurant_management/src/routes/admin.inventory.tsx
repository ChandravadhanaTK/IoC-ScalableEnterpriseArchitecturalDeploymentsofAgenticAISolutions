import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PackageX, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/inventory")({
  head: () => ({ meta: [{ title: "Inventory — CHEFSTATION Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminInventory,
});

type InvItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  unit_cost: number;
  storage_location: string;
};

function AdminInventory() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [cost, setCost] = useState("");

  const { data: items } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const { data } = await supabase.from("inventory_items").select("*").order("name");
      return (data ?? []) as InvItem[];
    },
  });

  const adjust = async (item: InvItem, delta: number) => {
    const next = Math.max(0, Number(item.current_stock) + delta);
    const { error } = await supabase.from("inventory_items").update({ current_stock: next }).eq("id", item.id);
    if (error) toast.error(error.message);
    else queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("inventory_items").insert({
      name,
      unit,
      current_stock: Number(stock),
      min_stock_level: Number(minStock),
      unit_cost: Number(cost),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${name} added to inventory`);
    setOpen(false);
    setName(""); setStock(""); setMinStock(""); setCost("");
    queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
  };

  const lowStock = (items ?? []).filter((i) => Number(i.current_stock) <= Number(i.min_stock_level));

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gold-gradient">Inventory</h1>
        <Button className="bg-primary font-bold text-primary-foreground" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Item
        </Button>
      </div>

      {lowStock.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <PackageX className="h-4 w-4" />
          {lowStock.length} item{lowStock.length > 1 ? "s" : ""} at or below minimum stock: {lowStock.map((i) => i.name).join(", ")}
        </div>
      )}

      <div className="surface-card mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Storage</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Min</th>
              <th className="px-4 py-3 text-right">Unit Cost</th>
              <th className="px-4 py-3 text-center">Adjust</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((i) => {
              const low = Number(i.current_stock) <= Number(i.min_stock_level);
              return (
                <tr key={i.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{i.name}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{i.category.replace("_", " ")}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{i.storage_location.replace("_", " ")}</td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${low ? "text-danger" : "text-foreground"}`}>
                    {i.current_stock} {i.unit}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{i.min_stock_level} {i.unit}</td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatINR(i.unit_cost)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7 border-border" onClick={() => adjust(i, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-7 w-7 border-border" onClick={() => adjust(i, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(items ?? []).length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No inventory items yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader><DialogTitle className="text-foreground">Add Inventory Item</DialogTitle></DialogHeader>
          <form onSubmit={addItem} className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 border-input bg-input-bg" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Unit</Label>
                <Input required value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="kg / L / pcs" />
              </div>
              <div>
                <Label className="text-muted-foreground">Unit cost (₹)</Label>
                <Input required type="number" min={0} step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} className="mt-1 border-input bg-input-bg" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Current stock</Label>
                <Input required type="number" min={0} step="0.01" value={stock} onChange={(e) => setStock(e.target.value)} className="mt-1 border-input bg-input-bg" />
              </div>
              <div>
                <Label className="text-muted-foreground">Min stock level</Label>
                <Input required type="number" min={0} step="0.01" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="mt-1 border-input bg-input-bg" />
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary font-bold text-primary-foreground">Add Item</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

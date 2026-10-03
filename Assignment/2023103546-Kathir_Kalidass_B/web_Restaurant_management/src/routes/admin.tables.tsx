import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { tableStatusColor } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/tables")({
  head: () => ({ meta: [{ title: "Tables — CHEFSTATION Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminTables,
});

const TABLE_STATUSES = ["available", "occupied", "reserved", "cleaning"];

function AdminTables() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [capacity, setCapacity] = useState(4);
  const [section, setSection] = useState("indoor");

  const { data: tables } = useQuery({
    queryKey: ["admin-tables"],
    queryFn: async () => {
      const { data } = await supabase.from("tables").select("*").order("table_number");
      return data ?? [];
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("tables").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else queryClient.invalidateQueries({ queryKey: ["admin-tables"] });
  };

  const addTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("tables").insert({ table_number: number, capacity, section });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Table ${number} added`);
    setOpen(false);
    setNumber("");
    queryClient.invalidateQueries({ queryKey: ["admin-tables"] });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-gold-gradient">Tables</h1>
        <Button className="bg-primary font-bold text-primary-foreground" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Table
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(tables ?? []).map((t) => (
          <div key={t.id} className={`rounded-xl border p-4 ${tableStatusColor(t.status)}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl font-bold">{t.table_number}</span>
              <span className="flex items-center gap-1 text-xs"><Users className="h-3.5 w-3.5" /> {t.capacity}</span>
            </div>
            <p className="mt-1 text-xs capitalize opacity-80">{t.section} · {t.status}</p>
            <Select value={t.status} onValueChange={(s) => setStatus(t.id, s)}>
              <SelectTrigger className="mt-3 h-8 border-border bg-background/60 text-xs capitalize"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover">
                {TABLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-border bg-card sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-foreground">Add Table</DialogTitle></DialogHeader>
          <form onSubmit={addTable} className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Table number</Label>
              <Input required value={number} onChange={(e) => setNumber(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="T7" />
            </div>
            <div>
              <Label className="text-muted-foreground">Capacity</Label>
              <Input type="number" min={1} max={20} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="mt-1 border-input bg-input-bg" />
            </div>
            <div>
              <Label className="text-muted-foreground">Section</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="mt-1 border-input bg-input-bg"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {["indoor", "outdoor", "bar"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-primary font-bold text-primary-foreground">Add Table</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Flame, Minus, Plus, Search, ShoppingBag, Trash2, Leaf } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { useCart, type CartItem } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { dishImage } from "@/lib/dish-images";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type MenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  dietary_tags: string[];
  calories: number | null;
  preparation_time: number | null;
  is_available: boolean;
  is_bestseller: boolean;
  spice_level: number;
  serving_size: string | null;
};

const DIETARY_FILTERS = ["vegetarian", "vegan", "gluten-free", "spicy"] as const;

export const Route = createFileRoute("/menu")({
  validateSearch: (search: Record<string, unknown>): { table?: string; cart?: string } => ({
    table: (search["table"] as string) || undefined,
    cart: (search["cart"] as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Menu — CHEFSTATION" },
      { name: "description", content: "Browse the CHEFSTATION menu: tandoor starters, signature curries, biryanis, breads, desserts and beverages. Order dine-in, takeaway or delivery." },
      { property: "og:title", content: "Menu — CHEFSTATION" },
      { property: "og:description", content: "Tandoor starters, signature curries, biryanis, breads, desserts and beverages." },
    ],
  }),
  component: MenuPage,
});

function SpiceIndicator({ level }: { level: number }) {
  if (!level) return null;
  return (
    <span className="flex items-center gap-0.5" aria-label={`Spice level ${level} of 4`}>
      {Array.from({ length: level }).map((_, i) => (
        <Flame key={i} className="h-3 w-3 fill-danger text-danger" />
      ))}
    </span>
  );
}

function MenuPage() {
  const { table, cart } = Route.useSearch();
  const navigate = useNavigate();
  const { items, addItem, updateQty, removeItem, clear, subtotal, count, setTableNumber } = useCart();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [dietary, setDietary] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [qty, setQty] = useState(1);
  const [cartOpen, setCartOpen] = useState(cart === "open");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (table) setTableNumber(table);
  }, [table, setTableNumber]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .eq("is_visible", true)
        .order("sort_order");
      return data ?? [];
    },
    staleTime: 120_000,
  });

  const { data: menuItems } = useQuery({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("*")
        .is("deleted_at", null)
        .order("sort_order");
      return (data ?? []) as MenuItem[];
    },
    staleTime: 120_000,
  });

  const filtered = useMemo(() => {
    let list = menuItems ?? [];
    if (debounced) {
      const q = debounced.toLowerCase();
      list = list.filter(
        (i) => i.name.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q),
      );
    }
    if (dietary) list = list.filter((i) => i.dietary_tags?.includes(dietary));
    if (activeCategory) list = list.filter((i) => i.category_id === activeCategory);
    return list;
  }, [menuItems, debounced, dietary, activeCategory]);

  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const openItem = (item: MenuItem) => {
    setSelected(item);
    setQty(1);
  };

  const addSelected = () => {
    if (!selected) return;
    const cartItem: CartItem = {
      menu_item_id: selected.id,
      name: selected.name,
      unit_price: Number(selected.price),
      quantity: qty,
      customizations: [],
      modifier_price: 0,
      spice_level: selected.spice_level,
    };
    addItem(cartItem);
    toast.success(`${selected.name} added to cart`);
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-gold-gradient md:text-4xl">Our Menu</h1>
            {table && (
              <p className="mt-1 text-sm text-primary">
                Ordering for table <span className="font-mono font-bold">{table}</span>
              </p>
            )}
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes…"
              className="border-input bg-input-bg pl-9 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="sticky top-16 z-30 -mx-4 mt-6 overflow-x-auto border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                !activeCategory ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {(categories ?? []).map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id === activeCategory ? null : c.id)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  activeCategory === c.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dietary filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          {DIETARY_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setDietary(dietary === f ? null : f)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                dietary === f
                  ? "border-success/60 bg-success/15 text-success"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Leaf className="h-3 w-3" /> {f}
            </button>
          ))}
        </div>

        {/* Items grid */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => {
            const img = dishImage(item.name);
            const soldOut = !item.is_available;
            return (
              <div
                key={item.id}
                className={`surface-card surface-card-hover group flex flex-col overflow-hidden ${soldOut ? "opacity-50" : "cursor-pointer"}`}
                onClick={() => !soldOut && openItem(item)}
              >
                {img ? (
                  <img src={img} alt={item.name} loading="lazy" width={816} height={816} className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-card-alt">
                    <span className="font-display text-4xl font-black text-primary/25">{item.name[0]}</span>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold leading-snug text-foreground">{item.name}</h3>
                    <SpiceIndicator level={item.spice_level} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.is_bestseller && (
                      <Badge className="border-primary/40 bg-primary/10 text-[10px] text-primary">Bestseller</Badge>
                    )}
                    {item.dietary_tags?.slice(0, 2).map((t) => (
                      <Badge key={t} variant="outline" className="border-success/40 text-[10px] capitalize text-success">
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div>
                      <span className="font-mono text-base font-bold text-primary">{formatINR(item.price)}</span>
                      {item.original_price && (
                        <span className="ml-2 text-xs text-muted-foreground line-through">{formatINR(item.original_price)}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={soldOut}
                      className="bg-primary font-bold text-primary-foreground btn-glow"
                      onClick={(e) => {
                        e.stopPropagation();
                        openItem(item);
                      }}
                    >
                      {soldOut ? "Sold Out" : "Add"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="py-20 text-center text-muted-foreground">No dishes match your filters.</p>
        )}
      </div>

      {/* Item detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          {selected && (
            <>
              {dishImage(selected.name) && (
                <img src={dishImage(selected.name)!} alt={selected.name} className="-mx-6 -mt-6 h-56 w-[calc(100%+3rem)] max-w-none object-cover" />
              )}
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-foreground">{selected.name}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">{selected.description}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {selected.calories && <span>{selected.calories} kcal</span>}
                {selected.serving_size && <span>· {selected.serving_size}</span>}
                {selected.preparation_time && <span>· ~{selected.preparation_time} min</span>}
                <SpiceIndicator level={selected.spice_level} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button size="icon" variant="outline" className="border-input bg-input-bg" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-6 text-center font-mono text-lg font-bold">{qty}</span>
                  <Button size="icon" variant="outline" className="border-input bg-input-bg" onClick={() => setQty(qty + 1)} aria-label="Increase quantity">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="font-mono text-xl font-bold text-primary">{formatINR(Number(selected.price) * qty)}</span>
              </div>
              <Button className="w-full bg-success font-bold text-white hover:bg-success/90" onClick={addSelected}>
                Add to Cart · {formatINR(Number(selected.price) * qty)}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart drawer */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="flex w-full flex-col border-border bg-card sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <ShoppingBag className="h-5 w-5 text-primary" /> Your Order ({count})
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto py-4">
            {items.length === 0 && (
              <p className="py-16 text-center text-sm text-muted-foreground">Your cart is empty. Add something delicious.</p>
            )}
            {items.map((it, i) => (
              <div key={i} className="surface-card flex items-center gap-3 p-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{it.name}</p>
                  <p className="font-mono text-xs text-primary">{formatINR(it.unit_price + it.modifier_price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-7 w-7 border-input bg-input-bg" onClick={() => updateQty(i, -1)} aria-label="Decrease">
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-5 text-center font-mono text-sm font-bold">{it.quantity}</span>
                  <Button size="icon" variant="outline" className="h-7 w-7 border-input bg-input-bg" onClick={() => updateQty(i, 1)} aria-label="Increase">
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-danger" onClick={() => removeItem(i)} aria-label="Remove">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {items.length > 0 && (
            <div className="space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="font-mono">{formatINR(subtotal)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>GST (5%)</span><span className="font-mono">{formatINR(tax)}</span></div>
              <div className="flex justify-between text-base font-bold text-foreground"><span>Total</span><span className="font-mono text-primary">{formatINR(total)}</span></div>
              <Button
                className="mt-2 w-full bg-primary py-6 text-base font-bold text-primary-foreground btn-glow"
                onClick={() => {
                  setCartOpen(false);
                  setCheckoutOpen(true);
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onPlaced={(orderNumber) => {
          clear();
          setCheckoutOpen(false);
          toast.success(`Order ${orderNumber} placed!`);
          navigate({ to: "/orders", search: { track: orderNumber } });
        }}
      />
    </div>
  );
}

function CheckoutDialog({
  open,
  onOpenChange,
  onPlaced,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPlaced: (orderNumber: string) => void;
}) {
  const { items, subtotal, tableNumber } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">(tableNumber ? "dine_in" : "takeaway");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [tableId, setTableId] = useState<string | null>(null);
  const [payment, setPayment] = useState("cash");
  const [instructions, setInstructions] = useState("");
  const [placing, setPlacing] = useState(false);

  const { data: tables } = useQuery({
    queryKey: ["available-tables"],
    queryFn: async () => {
      const { data } = await supabase.from("tables").select("id, table_number, capacity, status").eq("is_active", true).order("table_number");
      return data ?? [];
    },
    enabled: open,
  });

  useEffect(() => {
    if (open && tableNumber && tables) {
      const t = tables.find((t) => t.table_number === tableNumber);
      if (t) setTableId(t.id);
    }
  }, [open, tableNumber, tables]);

  useEffect(() => {
    if (open) setStep(1);
  }, [open]);

  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const placeOrder = async () => {
    setPlacing(true);
    const payload = {
      customer_id: user?.id ?? null,
      customer_name: name || user?.email?.split("@")[0] || "Guest",
      customer_phone: phone || null,
      table_id: orderType === "dine_in" ? tableId : null,
      order_type: orderType,
      status: "pending",
      items: items.map((i) => ({
        menu_item_id: i.menu_item_id,
        name: i.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        customizations: i.customizations,
        modifier_price: i.modifier_price,
        spice_level: i.spice_level,
        line_total: (i.unit_price + i.modifier_price) * i.quantity,
      })),
      subtotal,
      tax_amount: tax,
      service_charge: 0,
      total_amount: total,
      payment_method: payment,
      payment_status: payment === "cash" ? "pending" : "paid",
      special_instructions: instructions || null,
      delivery_address: orderType === "delivery" ? address : null,
      estimated_ready_at: new Date(Date.now() + 20 * 60000).toISOString(),
    };
    const { data, error } = await supabase.from("orders").insert(payload).select("order_number").single();
    setPlacing(false);
    if (error) {
      toast.error("Could not place order: " + error.message);
      return;
    }
    onPlaced(data.order_number);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground">Checkout — Step {step} of 3</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <Label className="text-muted-foreground">How would you like your order?</Label>
            <div className="grid grid-cols-3 gap-3">
              {(["dine_in", "takeaway", "delivery"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setOrderType(t)}
                  className={`rounded-xl border p-4 text-sm font-semibold capitalize transition-colors ${
                    orderType === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-card-alt text-muted-foreground"
                  }`}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
            <Button className="w-full bg-primary font-bold text-primary-foreground" onClick={() => setStep(2)}>Continue</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-3">
              <div>
                <Label className="text-muted-foreground">Your name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="Full name" />
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="+91 …" />
              </div>
              {orderType === "dine_in" && (
                <div>
                  <Label className="text-muted-foreground">Table</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(tables ?? []).map((t) => (
                      <button
                        key={t.id}
                        disabled={t.status === "occupied"}
                        onClick={() => setTableId(t.id)}
                        className={`rounded-lg border px-3 py-1.5 font-mono text-sm font-bold transition-colors disabled:opacity-40 ${
                          tableId === t.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card-alt text-muted-foreground"
                        }`}
                      >
                        {t.table_number}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {orderType === "delivery" && (
                <div>
                  <Label className="text-muted-foreground">Delivery address</Label>
                  <Textarea value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="Flat, street, landmark…" />
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Special instructions (optional)</Label>
                <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="Less spicy, no onion…" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-input" onClick={() => setStep(1)}>Back</Button>
              <Button
                className="flex-1 bg-primary font-bold text-primary-foreground"
                disabled={!name || (orderType === "dine_in" && !tableId) || (orderType === "delivery" && !address)}
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="surface-card max-h-40 space-y-1.5 overflow-y-auto p-4 text-sm">
              {items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-foreground">{i.quantity}× {i.name}</span>
                  <span className="font-mono text-muted-foreground">{formatINR((i.unit_price + i.modifier_price) * i.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 text-muted-foreground"><span>GST (5%)</span><span className="font-mono">{formatINR(tax)}</span></div>
              <div className="flex justify-between font-bold text-foreground"><span>Total</span><span className="font-mono text-primary">{formatINR(total)}</span></div>
            </div>
            <div>
              <Label className="text-muted-foreground">Payment (mock — no real charge)</Label>
              <RadioGroup value={payment} onValueChange={setPayment} className="mt-2 grid grid-cols-2 gap-2">
                {["cash", "card", "upi", "wallet"].map((m) => (
                  <label key={m} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-semibold capitalize ${payment === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-card-alt text-muted-foreground"}`}>
                    <RadioGroupItem value={m} /> {m.toUpperCase()}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-input" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1 bg-success py-5 font-bold text-white hover:bg-success/90" disabled={placing} onClick={placeOrder}>
                {placing ? "Placing…" : `Place Order · ${formatINR(total)}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

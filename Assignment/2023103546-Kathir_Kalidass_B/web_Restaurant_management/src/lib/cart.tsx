import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface CartItem {
  menu_item_id: string;
  name: string;
  unit_price: number;
  quantity: number;
  customizations: string[];
  modifier_price: number;
  spice_level: number;
  image_url?: string | null;
}

interface CartContextValue {
  items: CartItem[];
  tableNumber: string | null;
  setTableNumber: (t: string | null) => void;
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQty: (index: number, delta: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState<string | null>(null);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce(
      (s, i) => s + (i.unit_price + i.modifier_price) * i.quantity,
      0,
    );
    return {
      items,
      tableNumber,
      setTableNumber,
      addItem: (item) =>
        setItems((prev) => {
          const idx = prev.findIndex(
            (p) =>
              p.menu_item_id === item.menu_item_id &&
              JSON.stringify(p.customizations) === JSON.stringify(item.customizations),
          );
          if (idx >= 0) {
            const next = [...prev];
            const existing = next[idx]!;
            next[idx] = { ...existing, quantity: existing.quantity + item.quantity };
            return next;
          }
          return [...prev, item];
        }),
      removeItem: (index) => setItems((prev) => prev.filter((_, i) => i !== index)),
      updateQty: (index, delta) =>
        setItems((prev) =>
          prev
            .map((it, i) => (i === index ? { ...it, quantity: it.quantity + delta } : it))
            .filter((it) => it.quantity > 0),
        ),
      clear: () => setItems([]),
      subtotal,
      count: items.reduce((s, i) => s + i.quantity, 0),
    };
  }, [items, tableNumber]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

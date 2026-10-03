import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth";
import { formatINR, statusColor, ORDER_STATUSES } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/orders")({
  validateSearch: (search: Record<string, unknown>): { track?: string } => ({
    track: (search["track"] as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Track Your Order — CHEFSTATION" },
      { name: "description", content: "Track your CHEFSTATION order in real time — from confirmed to preparing to ready." },
      { property: "og:title", content: "Track Your Order — CHEFSTATION" },
      { property: "og:description", content: "Track your order in real time — from confirmed to preparing to ready." },
    ],
  }),
  component: OrdersPage,
});

type Order = {
  id: string;
  order_number: string;
  status: string;
  order_type: string;
  items: { name: string; quantity: number; line_total: number }[];
  total_amount: number;
  payment_method: string;
  estimated_ready_at: string | null;
  created_at: string;
  rating: number | null;
  customer_id: string | null;
};

function StatusTimeline({ status }: { status: string }) {
  const currentIdx = ORDER_STATUSES.indexOf(status as (typeof ORDER_STATUSES)[number]);
  const cancelled = status === "cancelled" || status === "refunded";
  return (
    <div className="flex items-center gap-1">
      {ORDER_STATUSES.map((s, i) => {
        const done = !cancelled && i <= currentIdx;
        return (
          <div key={s} className="flex flex-1 flex-col items-center gap-1">
            {done ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground/40" />
            )}
            <span className={`text-[10px] capitalize ${done ? "text-primary" : "text-muted-foreground/50"}`}>
              {s}
            </span>
            {i < ORDER_STATUSES.length - 1 && <div className="hidden" />}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order, canReview }: { order: Order; canReview: boolean }) {
  const queryClient = useQueryClient();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const submitReview = async () => {
    const { error } = await supabase
      .from("orders")
      .update({ rating, review: reviewText || null })
      .eq("id", order.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from("reviews").insert({
      order_id: order.id,
      customer_id: order.customer_id,
      rating,
      review_text: reviewText || null,
    });
    toast.success("Thanks for your review!");
    setReviewOpen(false);
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  return (
    <div className="surface-card surface-card-hover p-5 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-lg font-bold text-primary">#{order.order_number}</span>
        <Badge variant="outline" className={`capitalize ${statusColor(order.status)}`}>
          {order.status}
        </Badge>
      </div>
      <div className="mt-4">
        <StatusTimeline status={order.status} />
      </div>
      <div className="mt-4 space-y-1 text-sm">
        {order.items.map((i, idx) => (
          <div key={idx} className="flex justify-between text-muted-foreground">
            <span>{i.quantity}× {i.name}</span>
            <span className="font-mono">{formatINR(i.line_total)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs capitalize text-muted-foreground">
          {order.order_type.replace("_", " ")} · {order.payment_method.toUpperCase()} ·{" "}
          {new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
        </span>
        <span className="font-mono font-bold text-foreground">{formatINR(order.total_amount)}</span>
      </div>
      {canReview && !order.rating && ["served", "completed"].includes(order.status) && (
        <Button variant="outline" size="sm" className="mt-3 border-primary/40 text-primary" onClick={() => setReviewOpen(true)}>
          <Star className="mr-1.5 h-3.5 w-3.5" /> Rate & Review
        </Button>
      )}

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="border-border bg-card sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Rate order #{order.order_number}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((r) => (
              <button key={r} onClick={() => setRating(r)} aria-label={`${r} stars`}>
                <Star className={`h-8 w-8 ${r <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
              </button>
            ))}
          </div>
          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="How was your meal?"
            className="border-input bg-input-bg"
          />
          <Button className="bg-primary font-bold text-primary-foreground" onClick={submitReview}>
            Submit Review
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrdersPage() {
  const { track } = Route.useSearch();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [trackInput, setTrackInput] = useState(track ?? "");
  const [trackNumber, setTrackNumber] = useState(track ?? "");

  // Realtime: keep orders fresh
  useEffect(() => {
    const channel = supabase
      .channel("orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: myOrders, isLoading } = useQuery({
    queryKey: ["orders", "mine", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as unknown as Order[];
    },
    enabled: !!user,
  });

  const { data: trackedOrder } = useQuery({
    queryKey: ["orders", "track", trackNumber],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", trackNumber.toUpperCase().replace(/^#/, ""))
        .maybeSingle();
      return (data as Order | null) ?? null;
    },
    enabled: !!trackNumber,
  });

  const activeOrders = (myOrders ?? []).filter((o) =>
    ["pending", "confirmed", "preparing", "ready"].includes(o.status),
  );
  const pastOrders = (myOrders ?? []).filter(
    (o) => !["pending", "confirmed", "preparing", "ready"].includes(o.status),
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-gold-gradient md:text-4xl">Your Orders</h1>

        {/* Guest tracking */}
        <div className="surface-card mt-6 flex gap-2 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              placeholder="Enter order number, e.g. ORD-0007"
              className="border-input bg-input-bg pl-9 font-mono"
              onKeyDown={(e) => e.key === "Enter" && setTrackNumber(trackInput)}
            />
          </div>
          <Button className="bg-primary font-bold text-primary-foreground" onClick={() => setTrackNumber(trackInput)}>
            Track
          </Button>
        </div>

        {trackNumber && (
          <div className="mt-6">
            {trackedOrder ? (
              <OrderCard order={trackedOrder} canReview={false} />
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No order found for "{trackNumber}". Check the number and try again.
              </p>
            )}
          </div>
        )}

        {user ? (
          <>
            {isLoading && (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            {activeOrders.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-4 text-lg font-bold text-foreground">Active Orders</h2>
                <div className="space-y-4">
                  {activeOrders.map((o) => (
                    <OrderCard key={o.id} order={o} canReview />
                  ))}
                </div>
              </section>
            )}
            <section className="mt-8">
              <h2 className="mb-4 text-lg font-bold text-foreground">Order History</h2>
              {pastOrders.length === 0 && !isLoading && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No past orders yet. Time to fix that — the biryani is calling.
                </p>
              )}
              <div className="space-y-4">
                {pastOrders.map((o) => (
                  <OrderCard key={o.id} order={o} canReview />
                ))}
              </div>
            </section>
          </>
        ) : (
          !trackNumber && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Sign in to see your full order history, or track any order by its number above.
            </p>
          )
        )}
      </div>
    </div>
  );
}

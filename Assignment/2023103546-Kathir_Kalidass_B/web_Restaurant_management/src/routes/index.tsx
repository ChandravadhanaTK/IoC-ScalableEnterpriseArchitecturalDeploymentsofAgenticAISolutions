import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  UtensilsCrossed,
  QrCode,
  Clock,
  Sparkles,
  Star,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Flame,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { formatINR } from "@/lib/format";
import { dishImage } from "@/lib/dish-images";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CHEFSTATION — Premium Dining, Effortless Ordering" },
      {
        name: "description",
        content:
          "Warm hospitality meets smart ordering. Browse our menu, scan-and-order from your table, book reservations, and track your meal live.",
      },
      { property: "og:title", content: "CHEFSTATION — Premium Dining, Effortless Ordering" },
      {
        property: "og:description",
        content: "Scan-and-order from your table, book reservations, and track your meal live.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { data: featured } = useQuery({
    queryKey: ["featured-items"],
    queryFn: async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_featured", true)
        .eq("is_available", true)
        .limit(6);
      return data ?? [];
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["featured-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_featured", true)
        .limit(3);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">
        <img
          src={heroImg}
          alt="CHEFSTATION dining room"
          className="absolute inset-0 h-full w-full object-cover"
          width={1920}
          height={1088}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center animate-slide-up">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Est. 2026 · Kolkata
          </p>
          <h1 className="font-display text-5xl font-black leading-tight text-gold-gradient md:text-7xl">
            CHEFSTATION
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-cream/85">
            Slow-cooked curries, tandoor-fresh breads, and scan-to-order tables.
            Premium dining, effortless from first glance to last bite.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground transition-all btn-glow"
            >
              View Menu <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/reserve"
              className="inline-flex items-center gap-2 rounded-xl border border-primary/50 px-8 py-3.5 text-base font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Reserve a Table
            </Link>
          </div>
        </div>
      </section>

      {/* Featured items */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              Chef's Selection
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold text-foreground md:text-4xl">
              Featured Tonight
            </h2>
          </div>
          <Link to="/menu" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline md:flex">
            Full menu <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(featured ?? []).map((item, i) => {
            const img = dishImage(item.name);
            return (
              <div
                key={item.id}
                className="surface-card surface-card-hover group overflow-hidden animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {img ? (
                  <img
                    src={img}
                    alt={item.name}
                    loading="lazy"
                    width={816}
                    height={816}
                    className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center bg-card-alt">
                    <Flame className="h-10 w-10 text-primary/40" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-foreground">{item.name}</h3>
                    <span className="font-mono text-base font-bold text-primary">
                      {formatINR(item.price)}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  <Link
                    to="/menu"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    Order Now <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-card-alt/50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="font-display text-center text-3xl font-bold text-foreground md:text-4xl">
            How It Works
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: UtensilsCrossed, title: "Browse the Menu", text: "Filter by dietary preference, spice level, or craving — every dish described honestly." },
              { icon: QrCode, title: "Scan & Order", text: "Scan the QR at your table, customise your order, and pay mock-style in seconds." },
              { icon: Clock, title: "Track It Live", text: "Watch your order move from confirmed to preparing to ready — in real time." },
            ].map((s, i) => (
              <div key={s.title} className="surface-card p-8 text-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <s.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="font-display text-center text-3xl font-bold text-foreground md:text-4xl">
          Why CHEFSTATION
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Sparkles, title: "Fresh Ingredients", text: "Sourced every morning, never frozen." },
            { icon: Clock, title: "Fast Service", text: "Average table-to-plate time under 18 minutes." },
            { icon: QrCode, title: "Easy Ordering", text: "QR ordering, live tracking, zero waiting." },
            { icon: Star, title: "Great Deals", text: "Loyalty points on every rupee you spend." },
          ].map((f) => (
            <div key={f.title} className="surface-card surface-card-hover p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-bold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      {(reviews ?? []).length > 0 && (
        <section className="border-y border-border bg-card-alt/50 py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="font-display text-center text-3xl font-bold text-foreground md:text-4xl">
              What Guests Say
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {(reviews ?? []).map((r) => (
                <figure key={r.id} className="surface-card p-6">
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-cream/85">
                    "{r.review_text}"
                  </blockquote>
                  <figcaption className="mt-4 text-sm font-semibold text-primary">
                    — {r.customer_name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Info + Footer */}
      <footer className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              <span className="font-display text-lg font-black text-gold-gradient">CHEFSTATION</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              A warm table, a hot plate, and technology that stays out of the way.
            </p>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> 42 Gourmet Lane, Park Street, Kolkata</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> +91 98765 43210</p>
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> hello@chefstation.in</p>
            <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Open daily 11:00 – 23:00</p>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/menu" className="text-muted-foreground hover:text-primary">Menu</Link>
            <Link to="/reserve" className="text-muted-foreground hover:text-primary">Reservations</Link>
            <Link to="/orders" className="text-muted-foreground hover:text-primary">Track Order</Link>
            <Link to="/login" className="text-muted-foreground hover:text-primary">Staff Sign In</Link>
          </div>
        </div>
        <p className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © 2026 CHEFSTATION. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

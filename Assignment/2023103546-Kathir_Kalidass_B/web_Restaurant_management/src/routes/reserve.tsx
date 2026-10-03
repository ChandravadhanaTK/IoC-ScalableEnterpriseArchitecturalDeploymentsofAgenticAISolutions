import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, Users, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/reserve")({
  head: () => ({
    meta: [
      { title: "Reserve a Table — CHEFSTATION" },
      { name: "description", content: "Book a table at CHEFSTATION — choose your date, time, party size and seating preference." },
      { property: "og:title", content: "Reserve a Table — CHEFSTATION" },
      { property: "og:description", content: "Book a table at CHEFSTATION in under a minute." },
    ],
  }),
  component: ReservePage,
});

const TIME_SLOTS = [
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00",
];

function ReservePage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("19:00");
  const [partySize, setPartySize] = useState(2);
  const [section, setSection] = useState("no preference");
  const [requests, setRequests] = useState("");
  const [occasion, setOccasion] = useState("casual");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { data: myReservations } = useQuery({
    queryKey: ["my-reservations", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reservations")
        .select("*, tables(table_number)")
        .eq("customer_id", user!.id)
        .gte("reservation_date", format(new Date(), "yyyy-MM-dd"))
        .order("reservation_date")
        .limit(5);
      return data ?? [];
    },
    enabled: !!user,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from("reservations").insert({
      customer_id: user?.id ?? null,
      customer_name: name,
      customer_phone: phone || null,
      customer_email: email || null,
      party_size: partySize,
      reservation_date: date,
      reservation_time: time,
      special_requests: [section !== "no preference" ? `Prefers ${section} seating.` : "", requests]
        .filter(Boolean)
        .join(" ") || null,
      occasion,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success("Reservation request received!");
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center animate-bounce-in">
          <CheckCircle2 className="h-16 w-16 text-success" />
          <h1 className="font-display mt-6 text-3xl font-bold text-foreground">You're Booked!</h1>
          <p className="mt-3 text-muted-foreground">
            Table for {partySize} on {format(new Date(date + "T" + time), "EEEE, d MMMM 'at' h:mm a")}.
            We'll confirm shortly — see you soon, {name.split(" ")[0]}.
          </p>
          <Button className="mt-8 bg-primary font-bold text-primary-foreground btn-glow" onClick={() => setDone(false)}>
            Make Another Reservation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold text-gold-gradient md:text-4xl">Reserve a Table</h1>
        <p className="mt-2 text-sm text-muted-foreground">Open daily 11:00 – 23:00 · 90-minute slots</p>

        <form onSubmit={submit} className="surface-card mt-8 space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="Your name" />
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <Input required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="+91 …" />
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="you@example.com" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="flex items-center gap-1.5 text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> Date</Label>
              <Input
                type="date"
                required
                min={format(new Date(), "yyyy-MM-dd")}
                max={format(addDays(new Date(), 60), "yyyy-MM-dd")}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 border-input bg-input-bg"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="mt-1 border-input bg-input-bg"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-3.5 w-3.5" /> Guests</Label>
              <Select value={String(partySize)} onValueChange={(v) => setPartySize(Number(v))}>
                <SelectTrigger className="mt-1 border-input bg-input-bg"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} {n === 1 ? "guest" : "guests"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Seating preference</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="mt-1 border-input bg-input-bg"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {["no preference", "indoor", "outdoor", "bar"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground">Occasion</Label>
              <Select value={occasion} onValueChange={setOccasion}>
                <SelectTrigger className="mt-1 border-input bg-input-bg"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover">
                  {["casual", "birthday", "anniversary", "business"].map((o) => (
                    <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Special requests</Label>
            <Textarea value={requests} onChange={(e) => setRequests(e.target.value)} className="mt-1 border-input bg-input-bg" placeholder="Window seat, cake at dessert, wheelchair access…" />
          </div>

          <Button type="submit" disabled={submitting} className="w-full bg-primary py-6 text-base font-bold text-primary-foreground btn-glow">
            {submitting ? "Booking…" : "Confirm Reservation"}
          </Button>
        </form>

        {user && (myReservations ?? []).length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold text-foreground">Your Upcoming Reservations</h2>
            <div className="space-y-3">
              {(myReservations ?? []).map((r) => (
                <div key={r.id} className="surface-card flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      {format(new Date(r.reservation_date + "T" + r.reservation_time), "EEE, d MMM · h:mm a")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.party_size} guests {r.tables?.table_number ? `· Table ${r.tables.table_number}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                    r.status === "confirmed" ? "border-success/40 bg-success/10 text-success" : "border-warning/40 bg-warning/10 text-warning"
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

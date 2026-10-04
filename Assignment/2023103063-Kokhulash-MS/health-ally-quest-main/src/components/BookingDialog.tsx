import { useMemo, useState } from "react";
import { CalendarCheck, CheckCircle2, Loader2, MapPin, Video, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DOCTORS, INSURERS, nextDays, slotsFor } from "@/lib/clinic-data";
import type { Classification } from "@/lib/triage-engine";
import { uid, type Appointment } from "@/lib/store";
import { EsiBadge } from "./EsiBadge";
import { cn } from "@/lib/utils";

export function BookingDialog({
  open,
  onOpenChange,
  cls,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  cls: Classification;
  onConfirm: (a: Appointment) => void;
}) {
  const urgent = cls.esi === 3;
  const doctors = useMemo(() => {
    const d = DOCTORS.filter((x) => x.specialty === cls.specialty);
    return d.length ? d : DOCTORS.filter((x) => x.specialty === "Family Medicine");
  }, [cls.specialty]);
  const days = useMemo(() => nextDays(urgent ? 2 : 5), [urgent]);
  const [docId, setDocId] = useState(doctors[0]!.id);
  const [dayIdx, setDayIdx] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [visitType, setVisitType] = useState<"In-Person" | "Telehealth">("In-Person");
  const [insurer, setInsurer] = useState<string>(INSURERS[0]!);
  const [memberId, setMemberId] = useState("XJH-449120");
  const [verify, setVerify] = useState<"idle" | "checking" | "ok">("idle");

  const doc = doctors.find((d) => d.id === docId) ?? doctors[0]!;
  const slots = slotsFor(doc.id, days[dayIdx]!, urgent);

  const runVerify = () => {
    setVerify("checking");
    setTimeout(() => setVerify("ok"), 1100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" /> Scheduling Agent — book {cls.specialty}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <EsiBadge esi={cls.esi} /> {cls.disposition}. Slots shown from FHIR <code className="font-mono text-xs">Schedule/Slot</code> resources.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clinician</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {doctors.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setDocId(d.id);
                    setTime(null);
                  }}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    d.id === docId ? "border-primary bg-primary/5" : "hover:bg-muted",
                  )}
                >
                  <div className="font-semibold">{d.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {d.location}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Date {urgent && "· urgent window (next 48h)"}
            </h4>
            <div className="flex flex-wrap gap-2">
              {days.map((d, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDayIdx(i);
                    setTime(null);
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-center text-sm",
                    i === dayIdx ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  <div className="text-[11px] uppercase">{d.toLocaleDateString([], { weekday: "short" })}</div>
                  <div className="font-bold">{d.getDate()}</div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available slots</h4>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {slots.map((t) => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className={cn(
                    "rounded-md border py-1.5 font-mono text-sm",
                    t === time ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visit type</h4>
              <div className="flex gap-2">
                {(["In-Person", "Telehealth"] as const).map((v) => (
                  <button
                    key={v}
                    disabled={v === "Telehealth" && !doc.telehealth}
                    onClick={() => setVisitType(v)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-md border py-2 text-sm disabled:opacity-40",
                      visitType === v ? "border-primary bg-primary/10 font-semibold text-primary" : "hover:bg-muted",
                    )}
                  >
                    {v === "Telehealth" ? <Video className="h-4 w-4" /> : <Building2 className="h-4 w-4" />} {v}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Insurance</h4>
              <div className="flex gap-2">
                <Select value={insurer} onValueChange={(v) => { setInsurer(v); setVerify("idle"); }}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INSURERS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input value={memberId} onChange={(e) => { setMemberId(e.target.value.slice(0, 20)); setVerify("idle"); }} className="w-32 font-mono text-xs" />
              </div>
              <Button variant="outline" size="sm" className="mt-2 w-full" onClick={runVerify} disabled={verify !== "idle" || !memberId.trim()}>
                {verify === "checking" && <Loader2 className="h-4 w-4 animate-spin" />}
                {verify === "ok" && <CheckCircle2 className="h-4 w-4 text-routine" />}
                {verify === "idle" ? "Verify eligibility (270/271)" : verify === "checking" ? "Checking payer…" : "Coverage active · $25 copay"}
              </Button>
            </div>
          </section>

          <Button
            className="w-full"
            size="lg"
            disabled={!time || verify !== "ok"}
            onClick={() =>
              onConfirm({
                doctor: doc.name,
                specialty: doc.specialty,
                date: days[dayIdx]!.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }),
                time: time!,
                visitType,
                insurance: insurer,
                fhirId: uid("Appointment"),
              })
            }
          >
            {!time ? "Select a time slot" : verify !== "ok" ? "Verify insurance to continue" : `Confirm ${time} with ${doc.name}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

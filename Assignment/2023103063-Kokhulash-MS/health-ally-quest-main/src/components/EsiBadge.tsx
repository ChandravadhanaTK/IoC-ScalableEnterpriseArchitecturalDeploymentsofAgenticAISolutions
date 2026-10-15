import { cn } from "@/lib/utils";
import { esiLabel, esiTone, type Esi } from "@/lib/triage-engine";

const toneClass = {
  emergency: "bg-emergency/10 text-emergency border-emergency/30",
  urgent: "bg-urgent/10 text-urgent border-urgent/30",
  routine: "bg-routine/10 text-routine border-routine/30",
};

export function EsiBadge({ esi, className }: { esi: Esi; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        toneClass[esiTone(esi)],
        className,
      )}
    >
      ESI {esi} · {esiLabel(esi)}
    </span>
  );
}

export { toneClass };

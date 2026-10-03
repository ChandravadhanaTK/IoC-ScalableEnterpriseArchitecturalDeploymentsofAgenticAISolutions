import { AvailabilityTool, SupplierTool } from "@/tools/dataTools";
import type { ToolContext } from "@/tools/core";
import type { Policy, SupplierOutput, SupplierScore } from "@/types";
import { round1 } from "./formulas";

export class NoSuitableSupplierError extends Error {
  override name = "NoSuitableSupplierError";
  constructor(message: string, public evidence: string[], public partial: SupplierOutput) {
    super(message);
  }
}

/** Score = w_price·PriceScore + w_lead·LeadScore + w_rel·Reliability. Not cheapest-wins. */
export function runSupplierAgent(
  ctx: ToolContext,
  input: { productId: string; quantity: number; weights: Policy["weights"] },
): { output: SupplierOutput; evidence: string[] } {
  const { price: wp, lead: wl, reliability: wr } = input.weights;
  const evidence: string[] = [`Weights: price ${wp}, lead ${wl}, reliability ${wr}`];
  const all = SupplierTool.listForProduct(ctx, { productId: input.productId });
  const eligible = all.filter((s) => s.active && !s.blacklisted);
  all
    .filter((s) => !eligible.includes(s))
    .forEach((s) => evidence.push(`Excluded ${s.name}: ${s.blacklisted ? "blacklisted" : "inactive"}`));

  if (eligible.length === 0) {
    evidence.push(`No eligible supplier for ${input.productId} (${all.length} listed, 0 eligible)`);
    throw new NoSuitableSupplierError("No suitable supplier satisfies constraints", evidence, {
      selected: null, ranking: [], fallbackUsed: false,
    });
  }

  const minPrice = Math.min(...eligible.map((s) => s.unitPrice));
  const minLead = Math.min(...eligible.map((s) => s.leadTimeDays));
  const ranking: SupplierScore[] = eligible
    .map((s) => {
      const priceScore = round1((minPrice / s.unitPrice) * 100);
      const leadScore = round1((minLead / s.leadTimeDays) * 100);
      const total = round1(wp * priceScore + wl * leadScore + wr * s.reliability);
      return {
        supplierId: s.id, supplierName: s.name, unitPrice: s.unitPrice, leadTimeDays: s.leadTimeDays,
        reliability: s.reliability, priceScore, leadScore, total, available: false, capacity: s.capacity,
      };
    })
    .sort((a, b) => b.total - a.total);

  ranking.forEach((r) =>
    evidence.push(
      `${r.supplierName}: ${wp}×${r.priceScore} + ${wl}×${r.leadScore} + ${wr}×${r.reliability} = ${r.total}`,
    ),
  );

  let selected: SupplierScore | null = null;
  let primaryUnavailable: string | undefined;
  for (const r of ranking) {
    const a = AvailabilityTool.check(ctx, { supplierId: r.supplierId, quantity: input.quantity });
    r.available = a.available;
    if (a.available) {
      selected = r;
      break;
    }
    if (!primaryUnavailable) primaryUnavailable = r.supplierName;
    evidence.push(`${r.supplierName} unavailable: capacity ${a.capacity} < requested ${input.quantity} → re-scoring alternatives`);
  }

  const output: SupplierOutput = { selected, ranking, fallbackUsed: !!selected && !!primaryUnavailable, primaryUnavailable };
  if (!selected) {
    evidence.push(`No eligible supplier has capacity for ${input.quantity} units`);
    throw new NoSuitableSupplierError("No supplier with sufficient capacity", evidence, output);
  }
  evidence.push(`Selected ${selected.supplierName} (score ${selected.total}, $${selected.unitPrice}/unit, ${selected.leadTimeDays}d)`);
  return { output, evidence };
}

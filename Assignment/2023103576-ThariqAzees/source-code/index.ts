export interface MatchInput {
  freelancer: { skills: string[]; experienceLevel?: string; portfolioTech: string[] };
  project: { skills: string[]; experienceLevel: string; title: string };
}
export interface MatchResult { score: number; reasons: string[] }

const LEVELS = ["BEGINNER", "INTERMEDIATE", "EXPERT"];

/** Deterministic skill matcher. Works with no AI key; an embedding score (pgvector) can be blended in later. */
export function matchProject({ freelancer, project }: MatchInput): MatchResult {
  const have = new Set(freelancer.skills.map(s => s.toLowerCase()));
  const tech = new Set(freelancer.portfolioTech.map(s => s.toLowerCase()));
  const req = project.skills.map(s => s.toLowerCase());
  const reasons: string[] = [];
  const direct = req.filter(s => have.has(s));
  const viaPortfolio = req.filter(s => !have.has(s) && tech.has(s));
  direct.forEach(s => reasons.push(`✓ ${s} matches your skills`));
  viaPortfolio.forEach(s => reasons.push(`✓ ${s} appears in your portfolio work`));
  const coverage = req.length ? (direct.length + 0.6 * viaPortfolio.length) / req.length : 0;
  const gap = Math.abs(LEVELS.indexOf(project.experienceLevel) - LEVELS.indexOf(freelancer.experienceLevel ?? ""));
  const known = !!freelancer.experienceLevel && LEVELS.includes(project.experienceLevel);
  const levelFit = known ? Math.max(0, 1 - gap * 0.4) : 0.5;
  if (known && gap === 0) reasons.push("✓ Experience level fits");
  const score = Math.round(Math.min(0.97, coverage * 0.85 + levelFit * 0.15) * 100);
  return { score, reasons: reasons.length ? reasons : ["No direct skill overlap yet"] };
}

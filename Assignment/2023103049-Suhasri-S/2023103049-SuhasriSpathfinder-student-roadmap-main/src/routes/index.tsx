import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Map, LineChart, GitPullRequestArrow, UserCheck, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pathfinder — Your career roadmap that adapts as you learn" },
      { name: "description", content: "AI agents analyze your target career, find skill gaps, build a roadmap and adapt it — with your approval." },
      { property: "og:title", content: "Pathfinder — Your career roadmap that adapts as you learn" },
      { property: "og:description", content: "AI agents analyze your target career, find skill gaps, build a roadmap and adapt it — with your approval." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Search, t: "Career analysis", d: "The Career Analysis Agent breaks your target role into the competencies it really needs." },
  { icon: Target, t: "Skill-gap detection", d: "Your current skills are compared against the role — gaps are scored and prioritized." },
  { icon: Map, t: "AI roadmap", d: "A dependency-ordered plan sized to your weekly hours and timeline." },
  { icon: LineChart, t: "Progress analysis", d: "Tasks and assessment scores reveal weak spots and delays as you go." },
  { icon: GitPullRequestArrow, t: "Adaptive planning", d: "When you struggle, the plan proposes concrete changes — not vague advice." },
  { icon: UserCheck, t: "Human-in-the-loop", d: "Nothing major changes until you accept it. Every decision is recorded." },
  { icon: MessageCircle, t: "AI Career Mentor", d: "Ask anything — answers draw on your real roadmap, scores and changes." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-trail text-primary-foreground">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Logo />
          <div className="flex gap-2">
            <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/login">Sign in</Link></Button>
          </div>
        </header>
        <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-14 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-accent">Adaptive AI career planning</p>
            <h1 className="text-5xl font-bold leading-[1.05] sm:text-6xl">Your career roadmap that adapts as you learn.</h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/80">Tell Pathfinder where you want to go. A team of AI agents maps the skills, builds your plan, watches your progress — and asks before changing course.</p>
            <Button asChild size="lg" className="mt-8 bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/signup">Build My Career Roadmap</Link></Button>
          </div>
          <ol className="space-y-3 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-6 text-sm">
            {["AI detected an issue — SQL score 42%", "AI proposed a change — add window-function practice", "You review the proposal", "You accept or reject", "Your roadmap updates"].map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">{i + 1}</span>{s}
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold">Seven steps, one living plan</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border bg-card p-6">
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Button asChild size="lg"><Link to="/signup">Build My Career Roadmap</Link></Button>
        </div>
      </section>
    </div>
  );
}

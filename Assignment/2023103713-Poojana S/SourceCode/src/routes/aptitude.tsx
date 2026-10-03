import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { QuizModule } from "@/components/Quiz";
import { APTITUDE } from "@/lib/questions";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/aptitude")({
  head: () => meta("Aptitude Practice", "Timed quantitative, logical and verbal aptitude quizzes with Easy, Medium and Hard levels."),
  component: () => (
    <>
      <PageHeader eyebrow="Prepare · Aptitude" title="Aptitude practice" sub="Pick a section and difficulty. Each question gets 45 seconds." />
      <QuizModule module="Aptitude" bank={APTITUDE} />
    </>
  ),
});

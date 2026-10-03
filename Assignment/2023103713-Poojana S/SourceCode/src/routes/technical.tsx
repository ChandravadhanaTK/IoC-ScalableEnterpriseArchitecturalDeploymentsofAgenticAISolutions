import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { QuizModule } from "@/components/Quiz";
import { TECHNICAL } from "@/lib/questions";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/technical")({
  head: () => meta("Technical MCQs", "MCQs on C, C++, Java, Python, DSA, algorithms, DBMS, OS and computer networks."),
  component: () => (
    <>
      <PageHeader eyebrow="Prepare · Technical" title="Technical MCQs" sub="Ten core CS subjects asked in placement tests." />
      <QuizModule module="Technical" bank={TECHNICAL} />
    </>
  ),
});

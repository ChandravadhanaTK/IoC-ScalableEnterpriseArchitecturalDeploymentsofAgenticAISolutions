import { Brain, CheckCircle2, Mic2, MessageSquareText } from 'lucide-react';
import type { InterviewPlan, PlacementAnalysis } from '../types/placement';

export function Interview({ analysis }: { analysis?: PlacementAnalysis }) {
  if (!analysis) return <div className="page-stack"><section className="panel empty-state large"><Mic2 size={34} /><strong>No interview plan yet</strong><span>Run Placement Analysis to generate role-specific questions.</span></section></div>;
  return <div className="page-stack">
    <section className="intro-row"><div><div className="kicker"><Mic2 size={14} /> Role-aware practice</div><h2>Interview Center</h2><p>{analysis.job.role} questions generated from your actual skill gaps and project evidence.</p></div></section>
    <div className="content-grid two-col">
      <section className="panel"><div className="panel-heading"><div><div className="section-label">Focus areas</div><h3>What to revise</h3></div><Brain size={17} /></div><div className="focus-list">{analysis.interview.focusAreas.map((focus) => <div className="focus-row" key={focus}><CheckCircle2 size={16} /><span>{focus}</span></div>)}</div></section>
      <section className="panel"><div className="panel-heading"><div><div className="section-label">Practice set</div><h3>{analysis.interview.questions.length} targeted questions</h3></div><MessageSquareText size={17} /></div><QuestionList interview={analysis.interview} /></section>
    </div>
    <section className="panel"><div className="panel-heading"><div><div className="section-label">Mock interview mode</div><h3>Human-in-the-loop practice</h3></div></div><div className="mock-box"><div><strong>Ask yourself before you start</strong><span>Answer one question aloud, then compare your answer with the “what good looks like” guidance. This demo keeps the final evaluation under your control rather than silently scoring you.</span></div><span className="demo-badge">DEMO MODE</span></div></section>
  </div>;
}

function QuestionList({ interview }: { interview: InterviewPlan }) {
  return <div className="question-list">{interview.questions.map((q, i) => <div className="question-card" key={`${q.question}-${i}`}><div className={`question-type ${q.category}`}>{q.category}</div><strong>{q.question}</strong><span><b>What good looks like:</b> {q.whatGoodLooksLike}</span></div>)}</div>;
}

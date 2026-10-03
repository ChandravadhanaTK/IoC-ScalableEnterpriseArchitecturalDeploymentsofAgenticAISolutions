import { useMemo, useState } from 'react';
import { ArrowRight, Check, Mic2, Sparkles, Timer, UserRound } from 'lucide-react';
import type { InterviewQuestion, PlacementAnalysis, TrainingEvaluation, TrainingQuestion } from '../types/placement';
import { evaluateTrainingAnswer } from '../services/api';

function toTrainingQuestion(item: InterviewQuestion, index: number): TrainingQuestion {
  return {
    id: `INTERVIEW-${index}`,
    type: item.category === 'system-design' ? 'system-design' : item.category,
    difficulty: 'medium',
    title: `${item.category.replace('-', ' ')} round`,
    prompt: item.question,
    timeLimitMinutes: item.category === 'system-design' ? 12 : 6,
    skills: [],
    evaluationRubric: ['Correctness', 'Role relevance', 'Clarity', 'Structure'],
  };
}

export function MockInterview({ analysis }: { analysis: PlacementAnalysis }) {
  const [mode, setMode] = useState<'mixed' | InterviewQuestion['category']>('mixed');
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<TrainingEvaluation>();
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<number[]>([]);

  const questions = useMemo(() => {
    if (mode === 'mixed') return analysis.interview.questions.slice(0, 8);
    return analysis.interview.questions.filter((question) => question.category === mode).slice(0, 8);
  }, [analysis.interview.questions, mode]);

  const current = questions[index];
  const begin = () => { if (!questions.length) return; setStarted(true); setIndex(0); setAnswer(''); setEvaluation(undefined); setScores([]); };

  const evaluate = async () => {
    if (!current || !answer.trim()) return;
    setLoading(true); setEvaluation(undefined);
    try {
      const result = await evaluateTrainingAnswer({
        type: current.category === 'system-design' ? 'system-design' : current.category,
        difficulty: 'medium',
        job: analysis.job,
        skillGap: analysis.skillGap,
        resume: analysis.resume,
        question: toTrainingQuestion(current, index),
        answer,
      });
      setEvaluation(result);
      setScores((currentScores) => [...currentScores, result.score]);
    } finally { setLoading(false); }
  };

  const next = () => {
    if (index >= questions.length - 1) { setStarted(false); return; }
    setIndex((value) => value + 1); setAnswer(''); setEvaluation(undefined);
  };

  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;

  if (!started) return <div className="mock-interview-start">
    <div className="mock-start-copy"><div className="interview-avatar"><Mic2 size={20} /></div><div><span className="overline">AI mock interview</span><h3>Simulate the conversation, not just the question.</h3><p>Choose a mode. PlacementPilot will pull from the interview signals already identified for this role and move through the session one answer at a time.</p></div></div>
    <div className="mock-mode-grid">{(['mixed', 'technical', 'behavioral', 'project', 'system-design'] as const).map((value) => <button key={value} className={mode === value ? 'active' : ''} onClick={() => setMode(value)}><b>{value === 'system-design' ? 'System design' : value[0].toUpperCase() + value.slice(1)}</b><span>{value === 'mixed' ? 'Balanced round' : `${value.replace('-', ' ')} only`}</span></button>)}</div>
    <div className="mock-start-footer"><span><Timer size={14} /> {questions.length || 0} questions</span><button className="launch-button small" onClick={begin} disabled={!questions.length}>Start session <ArrowRight size={15} /></button></div>
  </div>;

  if (!current) return null;

  return <div className="mock-session">
    <div className="mock-session-head"><div><span className="overline">Question {index + 1} of {questions.length}</span><h3>{current.category.replace('-', ' ')} round</h3></div><span className="session-score">{average ? `${average} avg` : 'Session live'}</span></div>
    <div className="conversation"><div className="speaker-row"><span className="speaker-icon interviewer"><Mic2 size={15} /></span><div><small>PlacementPilot interviewer</small><p>{current.question}</p></div></div><div className="speaker-row candidate"><span className="speaker-icon candidate"><UserRound size={15} /></span><div><small>Your answer</small><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Answer as if the interviewer is in front of you..." rows={8} /></div></div></div>
    <div className="mock-actions"><span>Be concise. Use examples where you have them.</span><button className="launch-button small" disabled={loading || !answer.trim()} onClick={evaluation ? next : evaluate}>{loading ? <><Sparkles className="spin" size={15} /> Reviewing</> : evaluation ? <><Check size={15} /> Next question</> : <>Submit answer <ArrowRight size={15} /></>}</button></div>
    {evaluation && <div className="mock-evaluation"><div className="evaluation-score"><strong>{evaluation.score}</strong><span>/100</span></div><div><span className="overline">Interviewer feedback</span><p>{evaluation.feedback}</p><div className="feedback-tags">{evaluation.strengths.slice(0, 3).map((item) => <span key={item}><Check size={12} />{item}</span>)}</div></div></div>}
  </div>;
}

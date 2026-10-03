import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import type { Difficulty, PlacementAnalysis, TrainingEvaluation, TrainingQuestion } from '../types/placement';
import { evaluateTrainingAnswer, generateTrainingQuestion } from '../services/api';
import { saveTrainingAttempt } from '../services/storage';

type Attempt = {
  selectedOption?: number;
  evaluation?: TrainingEvaluation;
  submitted: boolean;
  redoing: boolean;
  redoCount: number;
};

const newAttempt = (): Attempt => ({ submitted: false, redoing: false, redoCount: 0 });

const DIFFICULTY_LABELS: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: 'Easy', color: '#55725b' },
  medium: { label: 'Medium', color: '#9b6a2b' },
  hard: { label: 'Hard', color: '#9c4d49' },
};

const MCQ_COUNT = 5;

export function RoleTrainer({ analysis, onAttemptSaved }: { analysis: PlacementAnalysis; onAttemptSaved: () => void }) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questions, setQuestions] = useState<TrainingQuestion[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);
  const submittedRef = useRef(false);

  const question = questions[currentIndex];
  const attempt = attempts[currentIndex];
  const canSubmit = attempt?.selectedOption != null && !attempt.submitted;
  const answered = attempts.filter(a => a.submitted && !a.redoing).length;
  const scores = attempts.flatMap(a => a.evaluation && !a.redoing ? [a.evaluation.score] : []);
  const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  useEffect(() => {
    if (sessionStarted && questions.length > 0) {
      setCardFlipped(false);
      const t = window.setTimeout(() => setCardFlipped(true), 50);
      return () => window.clearTimeout(t);
    }
  }, [currentIndex, sessionStarted]);

  const updateAttempt = (patch: Partial<Attempt>) =>
    setAttempts(items => items.map((item, i) => i === currentIndex ? { ...item, ...patch } : item));

  const startTest = async () => {
    setError('');
    setLoading(true);
    setLoadingProgress(0);
    setSessionStarted(false);
    setCompleted(false);

    try {
      const generated: TrainingQuestion[] = [];
      const sessionSeed = Date.now(); // unique seed per session ensures fresh questions

      for (let i = 0; i < MCQ_COUNT; i++) {
        setLoadingProgress(Math.round(((i) / MCQ_COUNT) * 100));
        let result: TrainingQuestion | undefined;

        for (let retry = 0; retry < 3; retry++) {
          const candidate = await generateTrainingQuestion({
            type: 'mcq',
            difficulty,
            job: analysis.job,
            skillGap: analysis.skillGap,
            resume: analysis.resume,
            recentQuestionIds: generated.map(q => q.id),
            // Include session seed in fingerprints to prevent caching across sessions
            recentQuestionFingerprints: [
              `SESSION:${sessionSeed}`,
              ...generated.map(q => `${q.title}|${q.prompt.slice(0, 80)}`),
            ],
          });

          const fp = candidate.prompt.trim().toLowerCase().slice(0, 100);
          const isDuplicate = generated.some(
            q => q.prompt.trim().toLowerCase().slice(0, 100) === fp || q.id === candidate.id
          );

          if (!isDuplicate && candidate.options?.length === 4) {
            result = candidate;
            break;
          }
        }

        if (!result) throw new Error(`Could not generate a unique question ${i + 1}. Please try again.`);
        generated.push(result);
      }

      setLoadingProgress(100);
      setQuestions(generated);
      setAttempts(generated.map(() => newAttempt()));
      setCurrentIndex(0);
      setCardFlipped(false);
      window.setTimeout(() => { setSessionStarted(true); }, 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate questions. Check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!question || !attempt || !canSubmit || loading || submittedRef.current) return;
    submittedRef.current = true;
    setError('');
    setLoading(true);
    try {
      const result = await evaluateTrainingAnswer({
        type: 'mcq',
        difficulty,
        job: analysis.job,
        skillGap: analysis.skillGap,
        resume: analysis.resume,
        question,
        answer: '',
        selectedOption: attempt.selectedOption,
      });
      updateAttempt({ evaluation: result, submitted: true });
      if (!attempt.redoing) {
        saveTrainingAttempt({
          id: `ATT-${Date.now()}`,
          createdAt: new Date().toISOString(),
          score: result.score,
          type: 'mcq',
          role: analysis.job.role,
          verdict: result.verdict,
        });
        onAttemptSaved();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed. Please try again.');
    } finally {
      submittedRef.current = false;
      setLoading(false);
    }
  };

  const redoQuestion = () => {
    updateAttempt({
      selectedOption: undefined,
      evaluation: undefined,
      submitted: false,
      redoing: true,
      redoCount: (attempt?.redoCount ?? 0) + 1,
    });
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  };

  const finish = () => {
    const unanswered = attempts.filter(a => !a.submitted).length;
    if (unanswered && !window.confirm(`${unanswered} question${unanswered !== 1 ? 's' : ''} not yet submitted. Finish anyway?`)) return;
    setCompleted(true);
  };

  const reset = () => {
    setQuestions([]);
    setAttempts([]);
    setCurrentIndex(0);
    setSessionStarted(false);
    setCompleted(false);
    setError('');
    setLoadingProgress(0);
  };

  // ── Completion screen ──────────────────────────────────────────────────────
  if (completed) {
    const correct = attempts.filter(a => a.evaluation && a.evaluation.score >= 70).length;
    const total = attempts.length;
    const pct = total ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="mcq-complete">
        <div className="mcq-complete-icon">
          <Trophy size={28} />
        </div>
        <h3 className="mcq-complete-title">Test complete!</h3>
        <div className="mcq-complete-ring" style={{ '--score': `${averageScore}%` } as React.CSSProperties}>
          <strong>{averageScore}</strong>
          <span>avg score</span>
        </div>
        <div className="mcq-complete-stats">
          <div><span>Correct</span><strong>{correct}/{total}</strong></div>
          <div><span>Pass rate</span><strong>{pct}%</strong></div>
          <div><span>Questions</span><strong>{total}</strong></div>
        </div>
        <div className="mcq-complete-actions">
          <button className="launch-button small" onClick={reset}>
            <RefreshCw size={15} /> Try a new set
          </button>
        </div>
      </div>
    );
  }

  // ── Setup screen ───────────────────────────────────────────────────────────
  if (!sessionStarted) {
    return (
      <div className="mcq-setup">
        <div className="mcq-setup-header">
          <div className="mcq-setup-icon"><Zap size={18} /></div>
          <div>
            <h3>MCQ Role Practice</h3>
            <p>Fresh questions generated from your job profile and skill gaps. Every session is unique.</p>
          </div>
        </div>

        <div className="mcq-controls-grid">
          <div className="mcq-control-group">
            <span className="overline">Difficulty</span>
            <div className="mcq-btn-row">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  className={`mcq-option-btn ${difficulty === d ? 'active' : ''}`}
                  onClick={() => { setDifficulty(d); reset(); }}
                  style={difficulty === d ? { borderColor: DIFFICULTY_LABELS[d].color, color: DIFFICULTY_LABELS[d].color } : undefined}
                >
                  {DIFFICULTY_LABELS[d].label}
                </button>
              ))}
            </div>
          </div>

          <div className="mcq-control-group">
            <span className="overline">Questions</span>
            <div className="mcq-btn-row">
              <span className="mcq-option-btn active">5</span>
            </div>
          </div>
        </div>

        <div className="mcq-role-tag">
          <span className="live-dot" />
          Grounded to: <strong>{analysis.job.role}</strong>
          {analysis.skillGap.priorityGaps[0]?.skill && (
            <span className="mcq-gap-tag">Priority gap: {analysis.skillGap.priorityGaps[0].skill}</span>
          )}
        </div>

        {error && <div className="inline-error">{error}</div>}

        {loading ? (
          <div className="mcq-loading">
            <div className="mcq-loading-bar">
              <div className="mcq-loading-fill" style={{ width: `${loadingProgress}%` }} />
            </div>
            <span><Sparkles className="spin" size={13} /> Generating question {Math.min(MCQ_COUNT, Math.ceil((loadingProgress / 100) * MCQ_COUNT))} of {MCQ_COUNT}…</span>
          </div>
        ) : (
          <button className="launch-button" onClick={startTest} disabled={loading}>
            Generate {MCQ_COUNT} fresh MCQs <ArrowRight size={16} />
          </button>
        )}
      </div>
    );
  }

  // ── Active question ────────────────────────────────────────────────────────
  const isCorrect = attempt?.evaluation && attempt.evaluation.score >= 70;
  const isWrong = attempt?.evaluation && attempt.evaluation.score < 70;

  return (
    <div className="mcq-arena">
      {/* Progress bar */}
      <div className="mcq-progress-bar">
        {questions.map((_, i) => {
          const a = attempts[i];
          const status = !a?.submitted ? 'pending' : (a.evaluation?.score ?? 0) >= 70 ? 'correct' : 'wrong';
          return (
            <button
              key={i}
              className={`mcq-progress-dot ${status} ${i === currentIndex ? 'current' : ''}`}
              onClick={() => setCurrentIndex(i)}
              title={`Question ${i + 1}`}
            >
              {status === 'correct' && <Check size={8} />}
              {status === 'wrong' && <X size={8} />}
            </button>
          );
        })}
        <div className="mcq-progress-meta">
          <span>{currentIndex + 1}/{questions.length}</span>
          {averageScore > 0 && <span className="mcq-avg-badge">{averageScore} avg</span>}
        </div>
      </div>

      {/* Question card */}
      <div className={`mcq-card ${cardFlipped ? 'flipped' : ''} ${isCorrect ? 'card-correct' : ''} ${isWrong ? 'card-wrong' : ''}`}>
        <div className="mcq-card-header">
          <div className="mcq-card-meta">
            <span className="mcq-q-num">Q{currentIndex + 1}</span>
            <span className="mcq-difficulty-badge" style={{ color: DIFFICULTY_LABELS[difficulty].color }}>
              {DIFFICULTY_LABELS[difficulty].label}
            </span>
            {question?.skills?.slice(0, 2).map(s => <span key={s} className="mcq-skill-chip">{s}</span>)}
          </div>
          {attempt?.redoCount > 0 && (
            <span className="mcq-redo-badge"><RefreshCw size={10} /> Redo #{attempt.redoCount}</span>
          )}
        </div>

        <div className="mcq-question-text">
          <p>{question?.prompt}</p>
        </div>

        <div className="mcq-options">
          {question?.options?.map((option, idx) => {
            const isSelected = attempt?.selectedOption === idx;
            const isAnswerCorrect = attempt?.evaluation && question?.answerIndex === idx;
            const isAnswerWrong = attempt?.evaluation && isSelected && question?.answerIndex !== idx;
            return (
              <button
                key={`${question.id}-${idx}`}
                className={`mcq option mcq-option ${isSelected ? 'selected' : ''} ${isAnswerCorrect ? 'reveal-correct' : ''} ${isAnswerWrong ? 'reveal-wrong' : ''}`}
                onClick={() => { if (!attempt?.submitted) updateAttempt({ selectedOption: idx }); }}
                disabled={attempt?.submitted}
              >
                <span className="mcq-option-letter">{String.fromCharCode(65 + idx)}</span>
                <span className="mcq-option-text">{option}</span>
                {isAnswerCorrect && <Check size={14} className="mcq-option-icon correct" />}
                {isAnswerWrong && <X size={14} className="mcq-option-icon wrong" />}
              </button>
            );
          })}
        </div>

        {/* Evaluation result */}
        {attempt?.evaluation && (
          <div className={`mcq-result ${isCorrect ? 'result-correct' : 'result-wrong'}`}>
            <div className="mcq-result-header">
              <div className="mcq-result-score">
                <strong>{attempt.evaluation.score}</strong>
                <span>/100</span>
              </div>
              <div>
                <div className="mcq-verdict">{isCorrect ? '✓ Correct' : '✗ Incorrect'}</div>
                <p className="mcq-result-feedback">{attempt.evaluation.feedback}</p>
              </div>
            </div>
            {attempt.evaluation.idealAnswer && (
              <div className="mcq-ideal-answer">
                <span className="overline">Expected answer</span>
                <p>{attempt.evaluation.idealAnswer}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="mcq-footer">
          <div className="mcq-nav-left">
            <button className="mcq-nav-btn" onClick={goPrev} disabled={currentIndex === 0}>
              ← Prev
            </button>
          </div>
          <div className="mcq-nav-right">
            {!attempt?.submitted ? (
              <button
                className="launch-button small"
                disabled={loading || !canSubmit}
                onClick={submit}
              >
                {loading ? <><Sparkles className="spin" size={13} /> Checking</> : <>Submit <ChevronRight size={14} /></>}
              </button>
            ) : (
              <>
                {isWrong && (
                  <button className="mcq-redo-button mcq-redo-btn" onClick={redoQuestion}>
                    <RefreshCw size={13} /> Redo question
                  </button>
                )}
                {currentIndex < questions.length - 1 ? (
                  <button className="launch-button small" onClick={goNext}>
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button className="launch-button small" onClick={finish}>
                    Finish <Check size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {error && <div className="inline-error" style={{ marginTop: 12 }}>{error}</div>}

      <div className="mcq-session-footer">
        <button className="mcq-reset-link" onClick={reset}>← New test</button>
        <span>{answered} of {questions.length} answered</span>
      </div>
    </div>
  );
}

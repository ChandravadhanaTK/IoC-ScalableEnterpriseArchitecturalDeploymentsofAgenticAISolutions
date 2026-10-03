import { useState, useEffect } from 'react';
import { useNav } from '@/nav';
import { useApp } from '@/context';
import { Question, QuizConfig, QuizResult } from '@/types';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function TakeQuizPage() {
  const { navigate, params } = useNav();
  const { addResult } = useApp();
  const questions: Question[] = params?.questions || [];
  const config: QuizConfig | undefined = params?.config;

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (questions.length > 0) {
      setAnswers(new Array(questions.length).fill(null));
      setTimeLeft(questions.length * 60);
    }
  }, [questions.length]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (questions.length === 0) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <div className="empty-state-icon"><AlertCircle size={28} /></div>
          <p>No quiz loaded. Generate a quiz first.</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('generate')}>Generate Quiz</button>
        </div>
      </div>
    );
  }

  if (timeLeft === 0 && answers.some(a => a === null)) {
    handleSubmit();
  }

  const q = questions[current];
  const answered = answers.filter(a => a !== null).length;
  const progress = (answered / questions.length) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const selectAnswer = (idx: number) => {
    setAnswers(prev => {
      const next = [...prev];
      next[current] = idx;
      return next;
    });
  };

  const goNext = () => {
    if (current < questions.length - 1) setCurrent(c => c + 1);
  };

  const goPrev = () => {
    if (current > 0) setCurrent(c => c - 1);
  };

  function handleSubmit() {
    const score = questions.reduce((s, q, i) => s + (answers[i] === q.correct ? 1 : 0), 0);
    const total = questions.length;
    const percentage = Math.round((score / total) * 100);
    const accuracy = Math.round((score / total) * 100);

    const result: QuizResult = {
      id: `r-${Date.now()}`,
      subject: config?.subject || 'General Knowledge',
      topic: config?.topic || q.topic,
      difficulty: config?.difficulty || 'Medium',
      questions,
      answers,
      score,
      total,
      percentage,
      accuracy,
      completedAt: new Date().toISOString(),
    };

    addResult(result);
    navigate('results', { result });
  }

  return (
    <div className="page-body-narrow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title" style={{ fontSize: 22 }}>{config?.subject || 'Quiz'}</h1>
          <p className="page-subtitle" style={{ fontSize: 13 }}>
            {config?.topic ? `Topic: ${config.topic}` : 'Mixed topics'} · {config?.difficulty || 'Medium'}
          </p>
        </div>
        <div className="flex items-center gap-2" style={{ background: 'var(--bg-alt)', padding: '8px 14px', borderRadius: 8 }}>
          <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontWeight: 600, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="card card-pad mb-4">
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Question {current + 1} of {questions.length}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{answered} answered</span>
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="card card-pad slide-up" key={current}>
        <div className="flex items-center gap-2 mb-4">
          <span className={`badge ${q.difficulty === 'Easy' ? 'badge-easy' : q.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'}`}>
            {q.difficulty}
          </span>
          <span className="badge badge-primary">{q.topic}</span>
          {q.type === 'True-False' && <span className="badge badge-neutral">True / False</span>}
        </div>

        <div className="quiz-question">{q.question}</div>

        {q.type === 'True-False' ? (
          <div className="tf-options">
            {q.options.map((opt, i) => (
              <div
                key={i}
                className={`quiz-option ${answers[current] === i ? 'selected' : ''}`}
                onClick={() => selectAnswer(i)}
              >
                <div className="quiz-option-marker">{i === 0 ? 'T' : 'F'}</div>
                <span style={{ fontWeight: 600 }}>{opt}</span>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {q.options.map((opt, i) => (
              <div
                key={i}
                className={`quiz-option ${answers[current] === i ? 'selected' : ''}`}
                onClick={() => selectAnswer(i)}
              >
                <div className="quiz-option-marker">{String.fromCharCode(65 + i)}</div>
                <span>{opt}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-6">
        <button className="btn btn-secondary" onClick={goPrev} disabled={current === 0}>
          <ChevronLeft size={18} /> Previous
        </button>

        <div className="flex gap-2">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: 10, height: 10, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: i === current ? 'var(--primary)' : answers[i] !== null ? 'var(--success)' : 'var(--bg-alt)',
                transition: 'all 0.15s',
              }}
            />
          ))}
        </div>

        {current < questions.length - 1 ? (
          <button className="btn btn-primary" onClick={goNext}>
            Next <ChevronRight size={18} />
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSubmit} disabled={answered === 0}>
            <CheckCircle size={18} /> Submit Quiz
          </button>
        )}
      </div>

      {current === questions.length - 1 && answered < questions.length && (
        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
          {questions.length - answered} question(s) unanswered
        </p>
      )}
    </div>
  );
}

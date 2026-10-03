import { useNav } from '@/nav';
import { QuizResult } from '@/types';
import { CheckCircle, XCircle, RotateCcw, Home, Award, Target, TrendingUp } from 'lucide-react';

export function ResultsPage() {
  const { navigate, params } = useNav();
  const result: QuizResult = params?.result;

  if (!result) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <div className="empty-state-icon"><Award size={28} /></div>
          <p>No results to display. Take a quiz first!</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('generate')}>Generate Quiz</button>
        </div>
      </div>
    );
  }

  const pct = result.percentage;
  const ringClass = pct >= 70 ? 'good' : pct >= 40 ? 'mid' : 'bad';
  const ringColor = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--error)';

  return (
    <div className="page-body-narrow">
      <div className="slide-up">
        <h1 className="page-title">Quiz Results</h1>
        <p className="page-subtitle">{result.subject} · {result.topic || 'Mixed topics'} · {result.difficulty}</p>
      </div>

      <div className="card card-pad mt-6" style={{ textAlign: 'center' }}>
        <div className="result-circle" style={{ margin: '0 auto', '--p': `${pct * 3.6}deg` } as any}>
          <div className="result-circle-inner" style={{ color: ringColor }}>{pct}%</div>
        </div>
        <h2 style={{ fontSize: 22, marginTop: 16 }}>
          {pct >= 70 ? 'Excellent work!' : pct >= 40 ? 'Good effort!' : 'Keep practicing!'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          You scored {result.score} out of {result.total}
        </p>

        <div className="grid grid-3 mt-6">
          <div>
            <div className="stat-icon" style={{ margin: '0 auto', background: '#d1fae5', color: 'var(--success)' }}>
              <CheckCircle size={22} />
            </div>
            <div className="stat-value" style={{ fontSize: 24, color: 'var(--success)' }}>{result.score}</div>
            <div className="stat-label">Correct</div>
          </div>
          <div>
            <div className="stat-icon" style={{ margin: '0 auto', background: '#fee2e2', color: 'var(--error)' }}>
              <XCircle size={22} />
            </div>
            <div className="stat-value" style={{ fontSize: 24, color: 'var(--error)' }}>{result.total - result.score}</div>
            <div className="stat-label">Incorrect</div>
          </div>
          <div>
            <div className="stat-icon" style={{ margin: '0 auto', background: '#e0e7ff', color: 'var(--primary)' }}>
              <Target size={22} />
            </div>
            <div className="stat-value" style={{ fontSize: 24 }}>{result.accuracy}%</div>
            <div className="stat-label">Accuracy</div>
          </div>
        </div>
      </div>

      <div className="card card-pad mt-6">
        <div className="section-title mb-4">Question Review & Explanations</div>
        {result.questions.map((q, i) => {
          const userAns = result.answers[i];
          const isCorrect = userAns === q.correct;
          const isUnanswered = userAns === null;

          return (
            <div key={q.id} style={{ padding: '20px 0', borderBottom: i < result.questions.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="stat-icon" style={{
                  margin: 0, width: 32, height: 32,
                  background: isCorrect ? '#d1fae5' : isUnanswered ? 'var(--bg-alt)' : '#fee2e2',
                  color: isCorrect ? 'var(--success)' : isUnanswered ? 'var(--text-muted)' : 'var(--error)',
                }}>
                  {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                    {i + 1}. {q.question}
                  </div>
                  <div className="flex gap-2 mb-3">
                    <span className={`badge ${q.difficulty === 'Easy' ? 'badge-easy' : q.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'}`}>
                      {q.difficulty}
                    </span>
                    <span className="badge badge-primary">{q.topic}</span>
                  </div>

                  {q.options.map((opt, oi) => {
                    let cls = '';
                    if (oi === q.correct) cls = 'correct';
                    else if (oi === userAns && !isCorrect) cls = 'incorrect';

                    return (
                      <div key={oi} className={`quiz-option ${cls}`} style={{ cursor: 'default', marginBottom: 6, padding: '10px 14px' }}>
                        <div className="quiz-option-marker" style={{ width: 24, height: 24, fontSize: 12 }}>
                          {String.fromCharCode(65 + oi)}
                        </div>
                        <span style={{ fontSize: 14 }}>{opt}</span>
                        {oi === q.correct && <CheckCircle size={16} style={{ marginLeft: 'auto', color: 'var(--success)' }} />}
                        {oi === userAns && !isCorrect && <XCircle size={16} style={{ marginLeft: 'auto', color: 'var(--error)' }} />}
                      </div>
                    );
                  })}

                  {isUnanswered && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 6 }}>
                      You didn't answer this question.
                    </div>
                  )}

                  <div style={{
                    marginTop: 10, padding: 12, background: 'var(--gradient-soft)',
                    borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                  }}>
                    <strong style={{ color: 'var(--primary)' }}>Explanation: </strong>{q.explanation}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mt-6 mb-6">
        <button className="btn btn-primary flex-1" onClick={() => navigate('generate')}>
          <RotateCcw size={18} /> Take Another Quiz
        </button>
        <button className="btn btn-secondary flex-1" onClick={() => navigate('progress')}>
          <TrendingUp size={18} /> View Progress
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('dashboard')}>
          <Home size={18} /> Dashboard
        </button>
      </div>
    </div>
  );
}

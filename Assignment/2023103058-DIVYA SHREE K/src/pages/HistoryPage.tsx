import { useApp } from '@/context';
import { useNav } from '@/nav';
import { QuizResult } from '@/types';
import { History, ArrowRight, Award, RotateCcw } from 'lucide-react';

export function HistoryPage() {
  const { results } = useApp();
  const { navigate } = useNav();

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (results.length === 0) {
    return (
      <div className="page-body">
        <div className="slide-up">
          <h1 className="page-title">Quiz History</h1>
          <p className="page-subtitle">All your past quiz attempts</p>
        </div>
        <div className="card card-pad mt-6">
          <div className="empty-state">
            <div className="empty-state-icon"><History size={28} /></div>
            <h3 style={{ marginBottom: 8 }}>No quizzes yet</h3>
            <p>Your completed quizzes will appear here.</p>
            <button className="btn btn-primary mt-4" onClick={() => navigate('generate')}>
              Generate Quiz <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-body">
      <div className="slide-up">
        <h1 className="page-title">Quiz History</h1>
        <p className="page-subtitle">{results.length} quiz{results.length > 1 ? 'es' : ''} completed</p>
      </div>

      <div className="flex flex-col gap-3 mt-6">
        {results.map((r: QuizResult) => (
          <div key={r.id} className="card card-pad card-hover">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4" style={{ flex: 1, minWidth: 0 }}>
                <div className="stat-icon" style={{
                  margin: 0,
                  background: r.percentage >= 70 ? '#d1fae5' : r.percentage >= 40 ? '#fef3c7' : '#fee2e2',
                  color: r.percentage >= 70 ? 'var(--success)' : r.percentage >= 40 ? 'var(--warning)' : 'var(--error)',
                }}>
                  <Award size={22} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.topic || 'Mixed topics'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>{r.subject}</span>
                    <span>·</span>
                    <span className={`badge ${r.difficulty === 'Easy' ? 'badge-easy' : r.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'}`} style={{ padding: '2px 8px' }}>
                      {r.difficulty}
                    </span>
                    <span>·</span>
                    <span>{formatDate(r.completedAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: r.percentage >= 70 ? 'var(--success)' : r.percentage >= 40 ? 'var(--warning)' : 'var(--error)' }}>
                    {r.percentage}%
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.score}/{r.total} correct</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('results', { result: r })}>
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <button className="btn btn-primary" onClick={() => navigate('generate')}>
          <RotateCcw size={18} /> Take Another Quiz
        </button>
      </div>
    </div>
  );
}

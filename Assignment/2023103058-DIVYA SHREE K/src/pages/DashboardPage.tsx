import { useNav } from '@/nav';
import { useApp } from '@/context';
import { analyzePerformance, recommendTopics } from '@/agent/analyzer';
import {
  TrendingUp, Bot, FileQuestion, Target, Award, Clock,
  ArrowRight, AlertCircle, Lightbulb, BookOpen
} from 'lucide-react';

export function DashboardPage() {
  const { navigate } = useNav();
  const { user, results } = useApp();
  const analysis = analyzePerformance(results);
  const recs = recommendTopics(results);

  const recent = results.slice(0, 5);
  const firstName = user?.name.split(' ')[0] || 'there';

  return (
    <div className="page-body">
      <div className="slide-up">
        <h1 className="page-title">Welcome back, {firstName}!</h1>
        <p className="page-subtitle">Ready to learn something new today?</p>
      </div>

      <div className="grid grid-4 mt-6">
        <div className="card card-hover stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff', color: 'var(--primary)' }}><Award size={22} /></div>
          <div className="stat-value">{analysis.totalQuizzes}</div>
          <div className="stat-label">Quizzes Completed</div>
        </div>
        <div className="card card-hover stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5', color: 'var(--success)' }}><Target size={22} /></div>
          <div className="stat-value">{analysis.averagePercentage}%</div>
          <div className="stat-label">Average Score</div>
        </div>
        <div className="card card-hover stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: 'var(--warning)' }}><TrendingUp size={22} /></div>
          <div className="stat-value">{analysis.overallAccuracy}%</div>
          <div className="stat-label">Overall Accuracy</div>
        </div>
        <div className="card card-hover stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: 'var(--error)' }}><Clock size={22} /></div>
          <div className="stat-value">{analysis.weakTopics.length}</div>
          <div className="stat-label">Weak Topics</div>
        </div>
      </div>

      <div className="grid grid-2 mt-6">
        <div className="card card-pad card-hover" onClick={() => navigate('generate')} style={{ cursor: 'pointer' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="stat-icon" style={{ margin: 0, background: 'var(--gradient)', color: '#fff' }}><FileQuestion size={22} /></div>
            <div>
              <div className="section-title">Start a Quiz</div>
              <div className="section-subtitle">Pick a subject and generate questions</div>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
            Choose from 5 subjects, set difficulty and question count, then test your knowledge.
          </p>
          <button className="btn btn-primary btn-sm">Start Now <ArrowRight size={16} /></button>
        </div>

        <div className="card card-pad card-hover" onClick={() => navigate('quizmate')} style={{ cursor: 'pointer' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="stat-icon" style={{ margin: 0, background: 'var(--gradient)', color: '#fff' }}><Bot size={22} /></div>
            <div>
              <div className="section-title">Ask QuizMate AI</div>
              <div className="section-subtitle">Your AI learning assistant</div>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>
            Say "Quiz me on Newton's laws" or "What should I revise?" and let the AI agent help.
          </p>
          <button className="btn btn-primary btn-sm">Chat with AI <ArrowRight size={16} /></button>
        </div>
      </div>

      <div className="grid grid-2 mt-6">
        <div className="card card-pad">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title">Recent Quizzes</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('history')}>View All</button>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><BookOpen size={28} /></div>
              <p>No quizzes yet. Start your first quiz!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recent.map(r => (
                <div key={r.id} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.topic || r.subject}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.subject} · {r.difficulty}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${r.percentage >= 70 ? 'badge-easy' : r.percentage >= 40 ? 'badge-medium' : 'badge-hard'}`}>
                      {r.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={18} style={{ color: 'var(--warning)' }} />
            <div className="section-title">Recommendations</div>
          </div>
          {recs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Lightbulb size={28} /></div>
              <p>Take quizzes to get personalized recommendations.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recs.map((rec, i) => (
                <div key={i} className="flex items-center gap-3" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div className="stat-icon" style={{ margin: 0, width: 36, height: 36, background: 'var(--gradient-soft)', color: 'var(--primary)' }}>
                    <AlertCircle size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{rec.topic}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rec.subject} — {rec.reason}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('generate', { subject: rec.subject, topic: rec.topic })}>
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {analysis.weakTopics.length > 0 && (
        <div className="card card-pad mt-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={18} style={{ color: 'var(--error)' }} />
            <div className="section-title">Weak Topics to Focus On</div>
          </div>
          <div className="pill-group">
            {analysis.weakTopics.map((t, i) => (
              <span key={i} className="tag tag-weak">{t.topic} — {t.accuracy}%</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

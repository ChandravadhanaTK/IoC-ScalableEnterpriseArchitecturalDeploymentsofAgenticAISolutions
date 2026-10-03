import { useApp } from '@/context';
import { useNav } from '@/nav';
import { analyzePerformance } from '@/agent/analyzer';
import { PerformanceChart } from '@/components/PerformanceChart';
import {
  Award, Target, TrendingUp, BookOpen, CheckCircle, AlertCircle,
  BarChart3, ArrowRight, Lightbulb
} from 'lucide-react';

export function ProgressPage() {
  const { results } = useApp();
  const { navigate } = useNav();
  const analysis = analyzePerformance(results);

  if (analysis.totalQuizzes === 0) {
    return (
      <div className="page-body">
        <div className="slide-up">
          <h1 className="page-title">My Progress</h1>
          <p className="page-subtitle">Track your learning journey over time</p>
        </div>
        <div className="card card-pad mt-6">
          <div className="empty-state">
            <div className="empty-state-icon"><BarChart3 size={28} /></div>
            <h3 style={{ marginBottom: 8 }}>No data yet</h3>
            <p>Take your first quiz to start tracking progress!</p>
            <button className="btn btn-primary mt-4" onClick={() => navigate('generate')}>
              Generate Quiz <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const chartData = [...analysis.recentScores].reverse().map((r, i) => ({
    label: `Q${i + 1}`,
    value: r.percentage,
  }));

  return (
    <div className="page-body">
      <div className="slide-up">
        <h1 className="page-title">My Progress</h1>
        <p className="page-subtitle">Your learning journey at a glance</p>
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
          <div className="stat-icon" style={{ background: '#fee2e2', color: 'var(--error)' }}><BookOpen size={22} /></div>
          <div className="stat-value">{analysis.bySubject.length}</div>
          <div className="stat-label">Subjects Covered</div>
        </div>
      </div>

      <div className="grid grid-2 mt-6">
        <div className="card card-pad">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
            <div className="section-title">Score Trend</div>
          </div>
          <PerformanceChart data={chartData} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
            Your last {chartData.length} quiz scores
          </p>
        </div>

        <div className="card card-pad">
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} style={{ color: 'var(--primary)' }} />
            <div className="section-title">Performance by Subject</div>
          </div>
          {analysis.bySubject.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}><p>No data yet</p></div>
          ) : (
            <div className="flex flex-col gap-4">
              {analysis.bySubject.map(s => (
                <div key={s.subject}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{s.subject}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: s.avgPercentage >= 70 ? 'var(--success)' : s.avgPercentage >= 40 ? 'var(--warning)' : 'var(--error)' }}>
                      {s.avgPercentage}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${s.avgPercentage}%`,
                      background: s.avgPercentage >= 70 ? 'var(--success)' : s.avgPercentage >= 40 ? 'var(--warning)' : 'var(--error)',
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.count} quiz{s.count > 1 ? 'es' : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-2 mt-6">
        <div className="card card-pad">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} style={{ color: 'var(--success)' }} />
            <div className="section-title">Strong Topics</div>
          </div>
          {analysis.strongTopics.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}><p>No strong topics yet — keep practicing!</p></div>
          ) : (
            <div className="flex flex-col gap-3">
              {analysis.strongTopics.map((t, i) => (
                <div key={i} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span className="tag tag-strong">{t.topic}</span>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 80 }} className="progress-bar">
                      <div className="progress-fill" style={{ width: `${t.accuracy}%`, background: 'var(--success)' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)', width: 36 }}>{t.accuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={18} style={{ color: 'var(--error)' }} />
            <div className="section-title">Weak Topics</div>
          </div>
          {analysis.weakTopics.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}><p>Great — no weak topics detected!</p></div>
          ) : (
            <div className="flex flex-col gap-3">
              {analysis.weakTopics.map((t, i) => (
                <div key={i} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <span className="tag tag-weak">{t.topic}</span>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 80 }} className="progress-bar">
                      <div className="progress-fill" style={{ width: `${t.accuracy}%`, background: 'var(--error)' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--error)', width: 36 }}>{t.accuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {analysis.byDifficulty.length > 0 && (
        <div className="card card-pad mt-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
            <div className="section-title">Performance by Difficulty</div>
          </div>
          <div className="grid grid-3">
            {analysis.byDifficulty.map(d => (
              <div key={d.difficulty} className="text-center" style={{ padding: 16, background: 'var(--bg-alt)', borderRadius: 12 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: d.avgPercentage >= 70 ? 'var(--success)' : d.avgPercentage >= 40 ? 'var(--warning)' : 'var(--error)' }}>
                  {d.avgPercentage}%
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{d.difficulty}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.count} quizzes</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

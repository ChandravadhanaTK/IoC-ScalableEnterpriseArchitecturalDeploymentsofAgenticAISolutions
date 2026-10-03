import { useApp } from '@/context';
import { useNav } from '@/nav';
import { analyzePerformance } from '@/agent/analyzer';
import { User as UserIcon, Mail, Calendar, Award, Target, TrendingUp, BookOpen, LogOut, Clock } from 'lucide-react';

export function ProfilePage() {
  const { user, results, logout } = useApp();
  const { navigate } = useNav();
  const analysis = analyzePerformance(results);

  if (!user) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <div className="empty-state-icon"><UserIcon size={28} /></div>
          <p>Please sign in to view your profile.</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('auth')}>Sign In</button>
        </div>
      </div>
    );
  }

  const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleLogout = () => {
    logout();
    navigate('landing');
  };

  return (
    <div className="page-body-narrow">
      <div className="slide-up">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Your account and learning summary</p>
      </div>

      <div className="card card-pad mt-6" style={{ textAlign: 'center' }}>
        <div className="avatar" style={{ width: 80, height: 80, fontSize: 28, margin: '0 auto 16px' }}>
          {initials}
        </div>
        <h2 style={{ fontSize: 22 }}>{user.name}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{user.email}</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Member since {joinDate}</span>
        </div>
      </div>

      <div className="grid grid-2 mt-6">
        <div className="card card-hover stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff', color: 'var(--primary)' }}><Award size={22} /></div>
          <div className="stat-value">{analysis.totalQuizzes}</div>
          <div className="stat-label">Total Quizzes</div>
        </div>
        <div className="card card-hover stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5', color: 'var(--success)' }}><Target size={22} /></div>
          <div className="stat-value">{analysis.averagePercentage}%</div>
          <div className="stat-label">Average Score</div>
        </div>
        <div className="card card-hover stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: 'var(--warning)' }}><TrendingUp size={22} /></div>
          <div className="stat-value">{analysis.overallAccuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="card card-hover stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2', color: 'var(--error)' }}><BookOpen size={22} /></div>
          <div className="stat-value">{analysis.bySubject.length}</div>
          <div className="stat-label">Subjects Studied</div>
        </div>
      </div>

      {analysis.bySubject.length > 0 && (
        <div className="card card-pad mt-6">
          <div className="section-title mb-4">Subjects Overview</div>
          <div className="flex flex-col gap-3">
            {analysis.bySubject.map(s => (
              <div key={s.subject} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div className="flex items-center gap-3">
                  <BookOpen size={18} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{s.subject}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.count} quizzes</span>
                </div>
                <span className={`badge ${s.avgPercentage >= 70 ? 'badge-easy' : s.avgPercentage >= 40 ? 'badge-medium' : 'badge-hard'}`}>
                  {s.avgPercentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card card-pad mt-6">
        <div className="section-title mb-4">Recent Activity</div>
        {analysis.recentScores.length === 0 ? (
          <div className="empty-state" style={{ padding: 20 }}><p>No activity yet</p></div>
        ) : (
          <div className="flex flex-col gap-3">
            {analysis.recentScores.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div className="flex items-center gap-3">
                  <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.topic || r.subject}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.subject}</div>
                  </div>
                </div>
                <span className={`badge ${r.percentage >= 70 ? 'badge-easy' : r.percentage >= 40 ? 'badge-medium' : 'badge-hard'}`}>
                  {r.percentage}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 32 }}>
        <button className="btn btn-danger" onClick={handleLogout}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useApp } from '@/context';
import { useNav } from '@/nav';
import { generateStudyPlan } from '@/studyPlanner';
import { StudyPlan, Subject } from '@/types';
import { analyzePerformance } from '@/agent/analyzer';
import { Calendar, Clock, BookOpen, Sparkles, Plus, Target } from 'lucide-react';

const SUBJECTS: Subject[] = ['Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'General Knowledge'];

export function StudyPlannerPage() {
  const { addPlan, plans, results } = useApp();
  const { navigate } = useNav();

  const today = new Date().toISOString().split('T')[0];
  const defaultExam = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  const [examDate, setExamDate] = useState(defaultExam);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>(['Mathematics']);
  const [weakTopics, setWeakTopics] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [plan, setPlan] = useState<StudyPlan | null>(plans[0] || null);
  const [generating, setGenerating] = useState(false);

  const analysis = analyzePerformance(results);
  const detectedWeak = analysis.weakTopics.map(t => t.topic).join(', ');

  const toggleSubject = (s: Subject) => {
    setSelectedSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleGenerate = () => {
    if (selectedSubjects.length === 0) {
      alert('Please select at least one subject.');
      return;
    }
    setGenerating(true);

    setTimeout(() => {
      const weakTopicList = weakTopics
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const newPlan = generateStudyPlan(examDate, selectedSubjects, weakTopicList, hoursPerDay);
      addPlan(newPlan);
      setPlan(newPlan);
      setGenerating(false);
    }, 800);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const daysUntilExam = plan ? Math.max(0, Math.ceil((new Date(plan.examDate).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div className="page-body">
      <div className="slide-up">
        <h1 className="page-title">Study Planner</h1>
        <p className="page-subtitle">Generate a personalized study plan based on your exam date and goals</p>
      </div>

      <div className="grid grid-2 mt-6" style={{ gridTemplateColumns: plan ? '1fr 1.5fr' : '1fr' }}>
        <div className="card card-pad">
          <div className="flex items-center gap-3 mb-6">
            <div className="stat-icon" style={{ margin: 0, background: 'var(--gradient)', color: '#fff' }}>
              <Calendar size={22} />
            </div>
            <div className="section-title">Plan Details</div>
          </div>

          <div className="form-group">
            <label className="form-label">Exam Date</label>
            <input className="form-input" type="date" value={examDate} min={today} onChange={e => setExamDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Subjects to Study</label>
            <div className="pill-group">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  className={`pill ${selectedSubjects.includes(s) ? 'active' : ''}`}
                  onClick={() => toggleSubject(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Weak Topics
              {detectedWeak && (
                <button
                  style={{ marginLeft: 8, fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setWeakTopics(detectedWeak)}
                >
                  Auto-fill from performance
                </button>
              )}
            </label>
            <textarea
              className="form-textarea"
              value={weakTopics}
              onChange={e => setWeakTopics(e.target.value)}
              placeholder="e.g. Integration, Newton's Laws, Organic Chemistry"
            />
            <div className="form-hint">Comma-separated topics you want to focus on</div>
          </div>

          <div className="form-group">
            <label className="form-label">Study Hours per Day: <strong style={{ color: 'var(--primary)' }}>{hoursPerDay}h</strong></label>
            <input
              type="range" min={1} max={8} value={hoursPerDay}
              onChange={e => setHoursPerDay(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          <button className="btn btn-primary btn-block btn-lg" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <><div className="spinner" /> Generating...</>
            ) : (
              <><Sparkles size={20} /> Generate Study Plan</>
            )}
          </button>
        </div>

        {plan && (
          <div className="card card-pad">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="stat-icon" style={{ margin: 0, background: 'var(--gradient-soft)', color: 'var(--primary)' }}>
                  <BookOpen size={22} />
                </div>
                <div>
                  <div className="section-title">Your Study Plan</div>
                  <div className="section-subtitle">{plan.days.length} days · {plan.hoursPerDay}h/day · Exam in {daysUntilExam} days</div>
                </div>
              </div>
              <span className="badge badge-primary" style={{ fontSize: 13 }}>
                <Target size={12} /> {plan.days.length * plan.hoursPerDay}h total
              </span>
            </div>

            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              {plan.days.map((day) => (
                <div key={day.dayNumber} className="plan-day" style={{
                  background: day.isExamDay ? 'var(--gradient-soft)' : 'transparent',
                  borderRadius: day.isExamDay ? 10 : 0,
                }}>
                  <div className="plan-day-num">{day.dayNumber}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{formatDate(day.date)}</div>
                    <div className="plan-day-date">{day.isExamDay ? 'Exam Day' : `${day.totalHours}h of study`}</div>
                    <div className="plan-tasks">
                      {day.sessions.map((s, i) => (
                        <div key={i} className="plan-task">
                          <div className="plan-task-dot" />
                          <span><strong>{s.subject}</strong> — {s.topic} ({s.duration}h)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-4">
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('generate')}>
                <Plus size={16} /> Practice Quiz
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('quizmate')}>
                <Sparkles size={16} /> Ask QuizMate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

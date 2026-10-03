import { useState, useEffect } from 'react';
import { useNav } from '@/nav';
import { generateQuiz, getAvailableTopics } from '@/questionBank';
import { QuizConfig, Subject, Difficulty, QuestionType } from '@/types';
import { FileQuestion, BookOpen, Settings, ArrowRight } from 'lucide-react';

const SUBJECT_ICONS: Record<Subject, string> = {
  Mathematics: 'π', Physics: '⚛', Chemistry: '⚗', 'Computer Science': '{}', 'General Knowledge': '?',
};

export function GenerateQuizPage() {
  const { navigate, params } = useNav();
  const [subject, setSubject] = useState<Subject>(params?.subject || 'Mathematics');
  const [topic, setTopic] = useState(params?.topic || '');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [numQuestions, setNumQuestions] = useState<5 | 10 | 15 | 20>(10);
  const [type, setType] = useState<QuestionType>('MCQ');
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);

  useEffect(() => {
    setAvailableTopics(getAvailableTopics(subject));
    if (params?.subject) setSubject(params.subject);
    if (params?.topic) setTopic(params.topic);
  }, [subject, params]);

  const handleGenerate = () => {
    const config: QuizConfig = { subject, topic, difficulty, numQuestions, type };
    const questions = generateQuiz(config);
    if (questions.length === 0) {
      alert('No questions available for this combination. Try a different topic or subject.');
      return;
    }
    navigate('takequiz', { questions, config });
  };

  return (
    <div className="page-body-narrow">
      <div className="slide-up">
        <h1 className="page-title">Generate Quiz</h1>
        <p className="page-subtitle">Customize your quiz and start testing your knowledge</p>
      </div>

      <div className="card card-pad mt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="stat-icon" style={{ margin: 0, background: 'var(--gradient)', color: '#fff' }}>
            <BookOpen size={22} />
          </div>
          <div className="section-title">Choose a Subject</div>
        </div>
        <div className="grid grid-3" style={{ gap: 12 }}>
          {(Object.keys(SUBJECT_ICONS) as Subject[]).map(s => (
            <button
              key={s}
              className={`card card-pad ${subject === s ? '' : 'card-hover'}`}
              onClick={() => setSubject(s)}
              style={{
                textAlign: 'center', cursor: 'pointer',
                border: subject === s ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: subject === s ? 'var(--gradient-soft)' : 'var(--surface)',
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: subject === s ? 'var(--primary)' : 'var(--text-secondary)' }}>
                {SUBJECT_ICONS[s]}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{s}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card card-pad mt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="stat-icon" style={{ margin: 0, background: 'var(--gradient)', color: '#fff' }}>
            <Settings size={22} />
          </div>
          <div className="section-title">Quiz Settings</div>
        </div>

        <div className="form-group">
          <label className="form-label">Topic (optional — leave blank for all topics)</label>
          <input
            className="form-input"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Newton's laws, Calculus, Atomic Structure..."
          />
          {availableTopics.length > 0 && (
            <div className="form-hint">Available topics: {availableTopics.join(', ')}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Difficulty</label>
          <div className="pill-group">
            {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
              <button key={d} className={`pill ${difficulty === d ? 'active' : ''}`} onClick={() => setDifficulty(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Number of Questions</label>
          <div className="pill-group">
            {([5, 10, 15, 20] as const).map(n => (
              <button key={n} className={`pill ${numQuestions === n ? 'active' : ''}`} onClick={() => setNumQuestions(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Question Type</label>
          <div className="pill-group">
            {(['MCQ', 'True-False', 'Mixed'] as QuestionType[]).map(t => (
              <button key={t} className={`pill ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
                {t === 'MCQ' ? 'Multiple Choice' : t === 'True-False' ? 'True / False' : 'Mixed'}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-lg btn-block" onClick={handleGenerate}>
          <FileQuestion size={20} /> Generate & Start Quiz <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

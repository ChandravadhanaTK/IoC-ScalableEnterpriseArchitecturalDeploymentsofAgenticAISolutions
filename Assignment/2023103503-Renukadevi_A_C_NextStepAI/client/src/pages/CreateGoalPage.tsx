import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Target, 
  BookOpen, 
  Code, 
  Briefcase, 
  GraduationCap, 
  ArrowRight, 
  Loader2 
} from 'lucide-react';
import Header from '../components/Header';
import { goalsApi } from '../services/api';

const PRESETS = [
  {
    title: 'Build a MERN Expense Tracker',
    description: 'Full-stack application using MongoDB, Express, React, and Node.js with JWT authentication and charts.',
    category: 'project',
    icon: Code,
  },
  {
    title: 'Solve 100 DSA Problems for Tech Interviews',
    description: 'Master Arrays, Two Pointers, Sliding Window, Linked Lists, Trees, and Dynamic Programming on LeetCode.',
    category: 'study',
    icon: BookOpen,
  },
  {
    title: 'Prepare for Machine Learning Final Exam',
    description: 'Review core algorithms: Linear & Logistic Regression, Decision Trees, SVMs, PCA, and Neural Networks.',
    category: 'exam',
    icon: GraduationCap,
  },
  {
    title: 'Prepare for Software Engineering Internship',
    description: 'Polish Git workflows, build 2 portfolio projects, practice behavioral questions and mock interviews.',
    category: 'career',
    icon: Briefcase,
  },
];

export default function CreateGoalPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('project');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setTitle(preset.title);
    setDescription(preset.description);
    setCategory(preset.category);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setError('');
    setLoading(true);
    try {
      const res = await goalsApi.create({
        title,
        description,
        category,
      });
      // Navigate to dashboard to see the first next step immediately
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to initialize goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="Start a New Goal"
        subtitle="NextStep Agent will decompose your goal into milestones and guide you step-by-step."
      />

      <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Preset suggestions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-electric-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Popular Learning Tracks
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRESETS.map((p, idx) => {
              const Icon = p.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-electric-500/40 text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-electric-500/20 text-electric-400 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-white group-hover:text-electric-300">
                      {p.title}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Goal Form */}
        <div className="card p-6 border-white/10">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-electric-400" />
            <span>Define Your Goal</span>
          </h3>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">What do you want to accomplish?</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Build an AI-powered SaaS with FastAPI and React"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Any specific details, technologies, or syllabus? (Optional)</label>
              <textarea
                className="input min-h-[100px] resize-none text-xs"
                placeholder="e.g. I want to deploy it to AWS, use PostgreSQL for database, and finish within 3 weeks."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Goal Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'project', label: '💻 Project' },
                  { id: 'study', label: '📚 Study / DSA' },
                  { id: 'exam', label: '🎓 Exam Prep' },
                  { id: 'career', label: '💼 Career' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      category === c.id
                        ? 'bg-electric-500/20 text-electric-400 border-electric-500/40'
                        : 'bg-white/5 text-white/60 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 shadow-lg shadow-electric-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>LangGraph Agent Generating Plan & First Step…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Plan & Select Next Step</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

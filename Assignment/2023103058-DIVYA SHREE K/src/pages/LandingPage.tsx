import { useNav } from '@/nav';
import { GraduationCap, Bot, FileQuestion, TrendingUp, ArrowRight, Sparkles, Calendar } from 'lucide-react';

export function LandingPage() {
  const { navigate } = useNav();

  return (
    <div className="landing-hero">
      <nav className="landing-nav">
        <div className="flex items-center gap-3">
          <div className="sidebar-logo"><GraduationCap size={22} /></div>
          <div className="sidebar-title" style={{ fontSize: 20 }}>Quiz<span>Mate</span></div>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('auth')}>Sign In</button>
      </nav>

      <div className="landing-content">
        <div className="landing-inner">
          <div className="landing-badge">
            <Sparkles size={14} /> AI-Powered Learning Assistant
          </div>
          <h1 className="landing-title">
            Learn smarter with<br />
            <span className="landing-title-gradient">QuizMate AI</span>
          </h1>
          <p className="landing-sub">
            Your personal AI tutor that generates quizzes, analyzes your performance,<br />
            and creates personalized study plans — all in one place.
          </p>
          <div className="landing-cta">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('auth')}>
              Get Started Free <ArrowRight size={18} />
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('auth')}>
              Sign In
            </button>
          </div>

          <div className="landing-features" style={{ margin: '64px auto 0' }}>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Bot size={24} /></div>
              <h3>AI Quiz Agent</h3>
              <p>Ask in natural language: "Quiz me on cell biology" and get instant quizzes.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><FileQuestion size={24} /></div>
              <h3>Smart Quiz Generator</h3>
              <p>Pick a subject, topic, and difficulty. Get real questions with explanations.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><TrendingUp size={24} /></div>
              <h3>Track Your Progress</h3>
              <p>See accuracy, strong and weak topics, and performance trends over time.</p>
            </div>
          </div>

          <div style={{ marginTop: 64, marginBottom: 48 }}>
            <div className="landing-features" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: 600 }}>
              <div className="landing-feature">
                <div className="landing-feature-icon"><Calendar size={24} /></div>
                <h3>Study Planner</h3>
                <p>Enter your exam date and get a personalized day-by-day study schedule.</p>
              </div>
              <div className="landing-feature">
                <div className="landing-feature-icon"><Sparkles size={24} /></div>
                <h3>AI Recommendations</h3>
              <p>Get smart suggestions on what to revise based on your quiz history.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

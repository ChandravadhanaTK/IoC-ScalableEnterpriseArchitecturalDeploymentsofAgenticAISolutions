import { useEffect, useState } from 'react';
import './styles.css';
import { Check } from 'lucide-react';
import { Analyze } from './pages/Analyze';
import { SinglePageWorkspace } from './pages/SinglePageWorkspace';
import { loadState, saveAnalysis, saveSession } from './services/storage';
import { runPlacementAnalysis } from './services/api';
import type { PlacementAnalysis, PlacementRequest, StoredRun } from './types/placement';

const JOURNEY = [
  { id: 'overview', label: 'Snapshot' },
  { id: 'analysis', label: 'Role' },
  { id: 'focus', label: 'Focus' },
  { id: 'rounds', label: 'Assessment' },
  { id: 'questions', label: 'Questions' },
  { id: 'trainer', label: 'Training' },
  { id: 'interview', label: 'Interview' },
];

function AgentLoadingOverlay() {
  return (
    <div className="agent-loading-overlay" role="status" aria-live="polite">
      <div className="agent-loading-panel">
        <span className="overline">PlacementPilot agents</span>
        <h2>Building your role map</h2>
        <p>Resume evidence, role signals and skill gaps are being coordinated now.</p>
        <div className="button-stack" aria-hidden="true">
          <div className="btn-wrapper">
            <button className="orb-btn btn-teal" type="button" tabIndex={-1}>
              <svg viewBox="0 0 24 24"><line x1="12" y1="4" x2="12" y2="20" /><line x1="4" y1="12" x2="20" y2="12" /></svg>
            </button>
            <span className="btn-label">Create</span>
          </div>
          <div className="btn-wrapper">
            <button className="orb-btn btn-silver" type="button" tabIndex={-1}>
              <svg viewBox="0 0 24 24"><path d="M7 17 L17 7 M17 7 L9 7 M17 7 L17 15" /></svg>
            </button>
            <span className="btn-label">Export</span>
          </div>
          <div className="btn-wrapper">
            <button className="orb-btn btn-mauve" type="button" tabIndex={-1}>
              <svg viewBox="0 0 24 24"><path d="M5 13 L10 17.5 L19 7" /></svg>
            </button>
            <span className="btn-label">Confirm</span>
          </div>
        </div>
        <div className="agent-loading-track"><span /></div>
        <small>Agents are working · your results will appear next</small>
      </div>
    </div>
  );
}

export default function App() {
  const initial = loadState();
  const [analysis, setAnalysis] = useState<PlacementAnalysis | undefined>(initial.lastAnalysis);
  const [recentRuns, setRecentRuns] = useState<StoredRun[]>(initial.recentRuns);
  const [trainingAttempts, setTrainingAttempts] = useState(initial.trainingAttempts);
  const [running, setRunning] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [boot, setBoot] = useState(() => {
    try { return !sessionStorage.getItem('placementpilot-booted'); } catch { return true; }
  });

  useEffect(() => {
    document.title = 'PlacementPilot — Career Intelligence';
    if (!boot) return;
    const timer = window.setTimeout(() => {
      setBoot(false);
      try { sessionStorage.setItem('placementpilot-booted', '1'); } catch { /* noop */ }
    }, 2050);
    return () => window.clearTimeout(timer);
  }, [boot]);

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!analysis) return;
    const targets = JOURNEY.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!targets.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-28% 0px -48% 0px', threshold: [0.15, 0.35, 0.55] },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [analysis]);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const execute = async (request: PlacementRequest) => {
    setRunning(true);
    setGlobalError('');
    saveSession(request);
    try {
      const result = await runPlacementAnalysis(request);
      saveAnalysis(result);
      const state = loadState();
      setAnalysis(result);
      setRecentRuns(state.recentRuns);
      setTrainingAttempts(state.trainingAttempts);
      setActiveSection('overview');
      window.setTimeout(() => scrollTo('overview'), 60);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Something went wrong while running the agents.');
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    setAnalysis(undefined);
    setGlobalError('');
    setActiveSection('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-root">
      {running && <AgentLoadingOverlay />}
      {boot && (
        <div className="boot-screen" aria-label="Loading PlacementPilot">
          <div className="boot-logo-wrap">
            <img className="boot-logo" src="/placementpilot-logo.png" alt="PlacementPilot" />
          </div>
        </div>
      )}

      <header className={`site-header ${headerScrolled ? 'is-scrolled' : ''}`}>
        <button className="brand" onClick={() => analysis ? scrollTo('overview') : window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="PlacementPilot home">
          <img className="brand-logo" src="/placementpilot-logo-cropped.png" alt="" />
          <span className="brand-block">
            <strong>PlacementPilot</strong>
            <small>career intelligence</small>
          </span>
        </button>

        {analysis ? (
          <div className="journey-header">
            <div className="journey-track" aria-label="Placement journey">
              {JOURNEY.map((step, index) => (
                <button
                  key={step.id}
                  className={`journey-step ${activeSection === step.id ? 'active' : ''} ${JOURNEY.findIndex((item) => item.id === activeSection) > index ? 'completed' : ''}`}
                  onClick={() => scrollTo(step.id)}
                  aria-current={activeSection === step.id ? 'step' : undefined}
                >
                  <span>{JOURNEY.findIndex((item) => item.id === activeSection) > index ? <Check size={10} /> : String(index + 1).padStart(2, '0')}</span>{step.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="header-caption">Analyze → practice → improve</div>
        )}

        <div className="header-actions">
          <span className="live-status"><i /> AI runtime ready</span>
          {analysis && <button className="header-link" onClick={reset}>New analysis</button>}
        </div>
      </header>

      <main className="single-page">
        {globalError && <div className="global-error">{globalError}</div>}
        {!analysis ? (
          <div className="entry-stage">
            <Analyze analysis={analysis} onRun={execute} running={running} onNavigate={() => undefined} />
          </div>
        ) : (
          <SinglePageWorkspace
            analysis={analysis}
            recentRuns={recentRuns}
            trainingAttempts={trainingAttempts}
            onTrainingAttemptSaved={() => setTrainingAttempts(loadState().trainingAttempts)}
            onRunNewAnalysis={reset}
          />
        )}
      </main>

      <footer className="site-footer">
        <span>PlacementPilot</span>
        <span>Session-local · server-side AI gateway</span>
        <span>Review AI guidance before use</span>
      </footer>
    </div>
  );
}

import type { CSSProperties } from 'react';
import { ArrowRight, BrainCircuit, CheckCircle2, Clock3, FileSearch, Gauge, PlaySquare, Radar, Target, TrendingUp, Trophy, Zap } from 'lucide-react';
import { AgentTimeline } from '../components/AgentTimeline';
import { MetricCard } from '../components/MetricCard';
import type { PageKey } from '../components/Sidebar';
import type { PlacementAnalysis, StoredRun } from '../types/placement';

export function Dashboard({ analysis, recentRuns, onNavigate, trainingAttempts }: { analysis?: PlacementAnalysis; recentRuns: StoredRun[]; onNavigate: (page: PageKey) => void; trainingAttempts: Array<{ score:number }> }) {
  const match = analysis?.skillGap.matchPercentage ?? 0;
  const topFocus = analysis?.job.focusAreas.slice(0, 3) ?? [];
  const avgTraining = trainingAttempts.length ? Math.round(trainingAttempts.reduce((a, b) => a + b.score, 0) / trainingAttempts.length) : 0;
  return <div className="page-stack dashboard-page">
    <section className="command-hero">
      <div className="hero-copy"><div className="kicker"><span className="kicker-line" /> AGENTIC PLACEMENT WORKSPACE</div><h2>Turn one job description into a <em>complete preparation strategy.</em></h2><p>PlacementPilot reads the role, maps your evidence, exposes the gaps and builds the exact training path you can practice against.</p><div className="hero-actions"><button className="primary-btn" onClick={() => onNavigate('analyze')}>Start placement run <ArrowRight size={16} /></button><button className="text-btn" onClick={() => onNavigate(analysis ? 'role' : 'analyze')}>Explore role intelligence <ArrowRight size={15} /></button></div></div>
      <div className="hero-visual"><div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" /><div className="hero-orbit orbit-c" /><div className="hero-core"><Radar size={24} /><span>AGENT<br />CORE</span></div><div className="orbit-node node-a"><BrainCircuit size={13} /></div><div className="orbit-node node-b"><Target size={13} /></div><div className="orbit-node node-c"><Zap size={13} /></div></div>
      <div className="hero-scan" />
    </section>

    <section className="metrics-grid six-grid">
      <MetricCard label="Placement match" value={`${match}%`} hint={analysis ? 'Evidence-based role fit' : 'Run an analysis'} icon={<Target size={17} />} accent="green" />
      <MetricCard label="Focus areas" value={analysis?.job.focusAreas.length ?? 0} hint="Priority study clusters" icon={<Radar size={17} />} />
      <MetricCard label="Skill gaps" value={analysis?.skillGap.priorityGaps.length ?? 0} hint="Gaps ranked by impact" icon={<TrendingUp size={17} />} />
      <MetricCard label="Training score" value={avgTraining ? `${avgTraining}%` : '—'} hint={trainingAttempts.length ? 'Local session average' : 'Complete a drill'} icon={<Trophy size={17} />} accent="gold" />
      <MetricCard label="Agent runs" value={recentRuns.length} hint="Saved in this browser" icon={<Clock3 size={17} />} />
      <MetricCard label="Runtime" value="READY" hint="Server-side AI gateway" icon={<Gauge size={17} />} accent="violet" />
    </section>

    <div className="dashboard-grid">
      <section className="panel spotlight-panel"><div className="panel-heading"><div><div className="section-label">Current opportunity</div><h3>{analysis?.job.role || 'No role analysed yet'}</h3></div>{analysis && <span className="role-chip">{analysis.job.company || 'Target employer'}</span>}</div>{analysis ? <div className="opportunity-body"><div className="readiness-ring" style={{ '--score': `${match}%` } as CSSProperties}><div><strong>{match}</strong><span>match</span></div></div><div className="opportunity-copy"><p>{analysis.job.roleSummary}</p><div className="tag-cloud">{analysis.skillGap.matchedSkills.slice(0,5).map((x)=> <span className="tag positive" key={x}>{x}</span>)}{analysis.skillGap.missingSkills.slice(0,3).map((x)=> <span className="tag warning" key={x}>{x}</span>)}</div><button className="secondary-btn" onClick={()=>onNavigate('role')}>Open role intelligence <ArrowRight size={15} /></button></div></div> : <div className="empty-state"><FileSearch size={27}/><strong>Nothing analysed yet</strong><span>Bring a resume and a target role into the workspace to unlock the intelligence layer.</span><button className="secondary-btn" onClick={()=>onNavigate('analyze')}>Start now <ArrowRight size={14}/></button></div>}</section>

      <section className="panel"><div className="panel-heading"><div><div className="section-label">Your next moves</div><h3>Focus areas</h3></div>{analysis && <button className="ghost-btn" onClick={()=>onNavigate('role')}>View all</button>}</div>{topFocus.length ? <div className="focus-stack">{topFocus.map((focus, i)=><div className="focus-card" key={focus.area}><div className="focus-rank">0{i+1}</div><div><b>{focus.area}</b><span>{focus.why}</span><div className="topic-line">{focus.suggestedTopics.slice(0,4).map(t=><span key={t}>{t}</span>)}</div></div><span className={`priority ${focus.priority}`}>{focus.priority}</span></div>)}</div> : <div className="empty-state compact"><Radar size={23}/><span>Role-specific focus areas will appear here.</span></div>}</section>
    </div>

    <div className="dashboard-grid lower">
      <section className="panel"><div className="panel-heading"><div><div className="section-label">Agent trace</div><h3>Latest workflow</h3></div><button className="ghost-btn" onClick={()=>onNavigate('monitor')}>Open monitor</button></div>{analysis ? <AgentTimeline steps={analysis.agentRun.steps} /> : <div className="empty-state compact"><BrainCircuit size={23}/><span>Run the agents to see the reasoning chain.</span></div>}</section>
      <section className="panel training-launch"><div className="training-glow" /><div className="panel-heading"><div><div className="section-label">Role Trainer</div><h3>Practice against the actual job</h3></div><PlaySquare size={18}/></div><p>Choose MCQs, coding, technical, behavioral, project or system-design questions. Every drill is grounded in the current role and your gaps.</p><div className="trainer-pills"><span>MCQ</span><span>CODING</span><span>TECHNICAL</span><span>SYSTEM DESIGN</span></div><button className="primary-btn wide" disabled={!analysis} onClick={()=>onNavigate('training')}>{analysis ? 'Enter role trainer' : 'Analyse a role first'} <ArrowRight size={15}/></button>{analysis && <div className="micro-proof"><CheckCircle2 size={13}/> {analysis.interview.questions.length} example interview prompts already mapped</div>}</section>
    </div>

    <section className="panel"><div className="panel-heading"><div><div className="section-label">Session history</div><h3>Recent placement runs</h3></div></div>{recentRuns.length ? <div className="run-list">{recentRuns.map((run)=><div className="run-item" key={run.id}><div className="run-logo"><BriefcaseIcon /></div><div className="run-main"><strong>{run.jobTitle}</strong><span>{run.company} · {new Date(run.createdAt).toLocaleString()}</span></div><div className="run-score">{run.matchPercentage}%</div></div>)}</div> : <div className="empty-state compact"><Clock3 size={22}/><span>Your browser-local run history will appear here.</span></div>}</section>
  </div>;
}
function BriefcaseIcon(){return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"/><path d="M3 12h18M10 12v2h4v-2"/></svg>}

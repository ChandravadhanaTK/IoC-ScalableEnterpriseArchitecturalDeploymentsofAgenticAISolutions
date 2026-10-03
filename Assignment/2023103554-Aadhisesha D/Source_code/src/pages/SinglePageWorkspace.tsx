import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  FileText,
  Gauge,
  Layers3,
  MessageSquareText,
  Mic2,
  PartyPopper,
  Play,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react';
import { AgentTimeline } from '../components/AgentTimeline';
import { RoleTrainer } from '../components/RoleTrainer';
import { MockInterview } from '../components/MockInterview';
import type { PlacementAnalysis, StoredRun } from '../types/placement';

const TONES = ['tone-amber', 'tone-slate', 'tone-sage', 'tone-clay', 'tone-plum', 'tone-ochre', 'tone-ink'];

function SectionArtifact({ number }: { number: string }) {
  return (
    <div className={`section-artifact artifact-${number}`} aria-hidden="true">
      <span className="artifact-core" />
      <span className="artifact-ring artifact-ring-one" />
      <span className="artifact-ring artifact-ring-two" />
      <span className="artifact-piece artifact-piece-one" />
      <span className="artifact-piece artifact-piece-two" />
    </div>
  );
}

function JourneySection({
  id,
  number,
  tone,
  eyebrow,
  title,
  description,
  children,
  nextId,
  nextLabel = 'Continue',
  skipId,
  skipLabel = 'Skip',
  noControls = false,
}: {
  id: string;
  number: string;
  tone: string;
  eyebrow: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  nextId?: string;
  nextLabel?: string;
  skipId?: string;
  skipLabel?: string;
  noControls?: boolean;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const go = (target?: string) => target && document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <section ref={sectionRef} id={id} className={`journey-section ${tone} ${visible ? 'is-visible' : ''}`}>
      <SectionArtifact number={number} />
      <div className="section-marker">
        <span>{number}</span>
        <i />
        <span className="section-marker-label">PlacementPilot</span>
      </div>
      <div className="section-intro journey-intro">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {description && <p>{description}</p>}
      </div>
      {children}
      {!noControls && (nextId || skipId) && (
        <div className="journey-controls">
          {nextId ? <button className="journey-next" onClick={() => go(nextId)}>{nextLabel} <ArrowRight size={15} /></button> : <span />}
          {skipId ? <button className="journey-skip" onClick={() => go(skipId)}>{skipLabel} <ArrowRight size={13} /></button> : <span />}
        </div>
      )}
    </section>
  );
}

export function SinglePageWorkspace({
  analysis,
  recentRuns,
  trainingAttempts,
  onTrainingAttemptSaved,
  onRunNewAnalysis,
}: {
  analysis: PlacementAnalysis;
  recentRuns: StoredRun[];
  trainingAttempts: Array<{ score: number }>;
  onTrainingAttemptSaved: () => void;
  onRunNewAnalysis: () => void;
}) {
  const [trainerOpen, setTrainerOpen] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const match = analysis.skillGap.matchPercentage;
  const trainingAverage = trainingAttempts.length
    ? Math.round(trainingAttempts.reduce((sum, item) => sum + item.score, 0) / trainingAttempts.length)
    : 0;


  const openTrainer = () => {
    setTrainerOpen(true);
    window.setTimeout(() => document.getElementById('trainer-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  };

  const openInterview = () => {
    setInterviewOpen(true);
    window.setTimeout(() => document.getElementById('interview-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  };

  return (
    <div className="workspace">
      <JourneySection
        id="overview" number="01" tone={TONES[0]}
        eyebrow={<><Target size={14} /> Your placement snapshot</>}
        title="Start with the clearest view of where you stand."
        description="This is your role-fit baseline: what your profile already supports, where the gaps are, and how much of the target role is currently covered."
        nextId="analysis" nextLabel="Understand the role"
        skipId="trainer" skipLabel="Skip to training"
      >
        <div className="overview-grid">
          <div className="hero-report-card">
            <div className="hero-report-copy">
              <p className="hero-company">{analysis.job.company || 'Target opportunity'} · {analysis.job.seniority}</p>
              <h1>{analysis.job.role}</h1>
              <p className="hero-summary">{analysis.job.roleSummary}</p>
              <div className="hero-tags">{analysis.job.keywords.slice(0, 7).map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
            </div>
            <div className="match-panel">
              <div className="match-ring" style={{ '--score': `${match}%` } as CSSProperties}>
                <strong>{match}%</strong><span>role fit</span>
              </div>
              <div className="match-caption"><span>Placement readiness</span><strong>{match >= 80 ? 'Good base' : match >= 60 ? 'Build the gaps' : 'Start with the basics'}</strong></div>
            </div>
          </div>

          <div className="snapshot-stats">
            <article><span>Profile strengths</span><strong>{analysis.skillGap.strengths.length}</strong><small>Signals your resume supports</small></article>
            <article><span>Priority gaps</span><strong>{analysis.skillGap.priorityGaps.length}</strong><small>Areas worth addressing first</small></article>
            <article><span>Focus areas</span><strong>{analysis.job.focusAreas.length}</strong><small>Topics inferred for this role</small></article>
            <article><span>Practice average</span><strong>{trainingAverage ? `${trainingAverage}%` : '—'}</strong><small>{trainingAverage ? 'Across saved session attempts' : 'Start a role-based drill'}</small></article>
          </div>
        </div>
      </JourneySection>

      <JourneySection
        id="analysis" number="02" tone={TONES[1]}
        eyebrow={<><BarChart3 size={14} /> Role intelligence</>}
        title="Know what the job is actually asking for."
        description="PlacementPilot separates explicit requirements from the preparation signals implied by the description, then compares them with your evidence."
        nextId="focus" nextLabel="See your focus areas"
        skipId="questions" skipLabel="Skip to questions"
      >
        <div className="analysis-grid">
          <section className="clean-card large-card">
            <div className="card-heading"><div><span className="overline">Candidate vs role</span><h3>Readiness map</h3></div><Target size={17} /></div>
            <div className="readiness-layout">
              <div className="readiness-bars">
                <SignalBar label="Matched skills" value={analysis.skillGap.matchedSkills.length} max={Math.max(analysis.skillGap.matchedSkills.length + analysis.skillGap.missingSkills.length + analysis.skillGap.partialSkills.length, 1)} tone="positive" />
                <SignalBar label="Partial coverage" value={analysis.skillGap.partialSkills.length} max={Math.max(analysis.skillGap.matchedSkills.length + analysis.skillGap.missingSkills.length + analysis.skillGap.partialSkills.length, 1)} tone="neutral" />
                <SignalBar label="Missing skills" value={analysis.skillGap.missingSkills.length} max={Math.max(analysis.skillGap.matchedSkills.length + analysis.skillGap.missingSkills.length + analysis.skillGap.partialSkills.length, 1)} tone="negative" />
              </div>
              <div className="skill-buckets">
                <SkillBucket title="You bring" icon={<TrendingUp size={14} />} values={analysis.skillGap.matchedSkills.slice(0, 8)} kind="positive" />
                <SkillBucket title="Needs work" icon={<TrendingDown size={14} />} values={analysis.skillGap.missingSkills.slice(0, 8)} kind="negative" />
              </div>
            </div>
            <div className="summary-callout"><strong>Agent read</strong><span>{analysis.skillGap.summary}</span></div>
          </section>

          <section className="clean-card">
            <div className="card-heading"><div><span className="overline">Role essentials</span><h3>Responsibilities</h3></div><Layers3 size={17} /></div>
            <div className="bullet-list">{analysis.job.responsibilities.slice(0, 7).map((item) => <div key={item}><Check size={13} />{item}</div>)}</div>
          </section>
        </div>

        <div className="analysis-grid three-up">
          <SkillColumn title="Required skills" values={analysis.job.requiredSkills} />
          <SkillColumn title="Preferred skills" values={analysis.job.preferredSkills} muted />
          <SkillColumn title="Technology stack" values={analysis.job.technologies} />
        </div>

        <div className="profile-insight-grid">
          <section className="clean-card profile-insight">
            <div className="card-heading"><div><span className="overline">Your profile</span><h3>{analysis.resume.candidateName}</h3></div><UserRound size={16} /></div>
            <p className="profile-headline">{analysis.resume.headline}</p>
            <div className="profile-facts">
              <div><span>Skills</span><strong>{analysis.resume.skills.length}</strong></div>
              <div><span>Projects</span><strong>{analysis.resume.projects.length}</strong></div>
              <div><span>Certifications</span><strong>{analysis.resume.certifications.length}</strong></div>
              <div><span>Databases</span><strong>{analysis.resume.databases.length}</strong></div>
            </div>
            <div className="plain-tags">{analysis.resume.skills.slice(0, 10).map((skill) => <span key={skill}>{skill}</span>)}</div>
          </section>
          <section className="clean-card signal-insight">
            <div className="card-heading"><div><span className="overline">Role signals</span><h3>What the description is emphasizing</h3></div><Layers3 size={16} /></div>
            <div className="bullet-list compact">{analysis.job.signals.slice(0, 6).map((signal) => <div key={signal}><Check size={13} />{signal}</div>)}</div>
            <div className="soft-skill-line"><span>Soft skills</span><div>{analysis.job.softSkills.slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}</div></div>
          </section>
        </div>
      </JourneySection>

      <JourneySection
        id="focus" number="03" tone={TONES[2]}
        eyebrow={<><Gauge size={14} /> Preparation priorities</>}
        title="Turn the gaps into a focused plan."
        description="These areas are ranked from the role requirements plus the gaps found in your profile. Expand the ones you need to understand before you practice."
        nextId="rounds" nextLabel="See the assessment map"
        skipId="trainer" skipLabel="Go straight to training"
      >
        <div className="focus-grid">
          {analysis.job.focusAreas.map((focus, index) => (
            <article className="focus-tile" key={focus.area}>
              <div className="focus-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="focus-copy">
                <div className="focus-top"><h3>{focus.area}</h3><span className={`priority-chip ${focus.priority}`}>{focus.priority}</span></div>
                <p>{focus.why}</p>
                <div className="topic-list">{focus.suggestedTopics.slice(0, 5).map((topic) => <span key={topic}>{topic}</span>)}</div>
              </div>
            </article>
          ))}
        </div>
      </JourneySection>

      <JourneySection
        id="rounds" number="04" tone={TONES[3]}
        eyebrow={<><Layers3 size={14} /> Assessment map</>}
        title="Know what you may be assessed on."
        description="These are agent-inferred preparation signals based on the job description. They are not guarantees of the employer's actual process."
        nextId="questions" nextLabel="See example questions"
        skipId="trainer" skipLabel="Skip to practice"
      >
        <div className="rounds-grid">
          {analysis.job.interviewRounds.map((round, index) => (
            <article className="round-tile" key={`${round.round}-${index}`}>
              <span className="round-index">0{index + 1}</span>
              <div><h3>{round.round}</h3><p>{round.purpose}</p><div className="round-tags">{round.questionTypes.map((type) => <span key={type}>{type}</span>)}</div></div>
              <div className="round-examples">{round.exampleQuestions.slice(0, 2).map((question) => <div key={question}><MessageSquareText size={13} />{question}</div>)}</div>
            </article>
          ))}
        </div>
      </JourneySection>

      <JourneySection
        id="questions" number="05" tone={TONES[4]}
        eyebrow={<><MessageSquareText size={14} /> Example questions</>}
        title="See the questions you should be ready for."
        description="Warm up with realistic questions before you enter the role trainer or mock interview."
        nextId="trainer" nextLabel="Get the recommended test"
        skipId="interview" skipLabel="Skip to mock interview"
      >
        <div className="question-list-grid">
          {analysis.job.exampleQuestions.slice(0, 10).map((question, index) => (
            <div className="example-question" key={question}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{question}</p>
            </div>
          ))}
        </div>
      </JourneySection>

      <JourneySection
        id="trainer" number="06" tone={TONES[5]}
        eyebrow={<><Play size={14} /> MCQ Role Practice</>}
        title="Test your knowledge with live MCQs."
        description={`Every question is freshly generated with Gemini — grounded in the ${analysis.job.role} role, your skill gaps, and the job's requirements. No two sessions are the same.`}
        noControls
      >
        <div className="trainer-launch journey-launch">
          <div className="launch-copy">
            <div className="launch-kicker"><span>MCQ</span><span>{analysis.job.role}</span><span>role-specific</span></div>
            <h3>Fresh questions. Every session. Built from your actual profile.</h3>
            <p>Choose your difficulty and number of questions. The AI generates brand-new MCQs each time, evaluates your answers, and lets you redo any wrong ones.</p>
          </div>
          <button className="launch-button" onClick={openTrainer}><span>{trainerOpen ? 'Jump to active test' : 'Start MCQ practice'}</span><ArrowRight size={17} /></button>
        </div>
        {!trainerOpen && (
          <div className="journey-module-skip">
            <span>Prefer the mock interview first?</span>
            <button className="journey-skip" onClick={openInterview}>Skip to mock interview <ArrowRight size={13} /></button>
          </div>
        )}

        {trainerOpen && (
          <section id="trainer-workspace" className="interactive-section reveal-on-view">
            <div className="interactive-header"><div><span className="eyebrow"><Code2 size={14} /> Role trainer</span><h2>Pick your difficulty and start.</h2></div><button className="close-button" onClick={() => setTrainerOpen(false)} aria-label="Close trainer"><X size={18} /></button></div>
            <RoleTrainer analysis={analysis} onAttemptSaved={onTrainingAttemptSaved} />
            <div className="post-module-actions"><button className="journey-next" onClick={openInterview}>Continue to mock interview <ArrowRight size={15} /></button><button className="journey-skip" onClick={openInterview}>Skip remaining training</button></div>
          </section>
        )}
      </JourneySection>

      <JourneySection
        id="interview" number="07" tone={TONES[6]}
        eyebrow={<><Mic2 size={14} /> Mock interview</>}
        title="Now practice the conversation."
        description="The mock interviewer stays grounded in this job, your resume evidence, the skill gaps found earlier, and the assessment signals for the role."
        nextId="goodbye" nextLabel="Complete the journey"
        noControls
      >
        <div className="interview-launch journey-launch">
          <div>
            <div className="launch-kicker"><span>TECHNICAL</span><span>BEHAVIORAL</span><span>PROJECT</span><span>SYSTEM DESIGN</span></div>
            <h3>Practice the part a test cannot simulate: explaining your thinking.</h3>
            <p>Answer one question at a time. Get structured feedback on clarity, relevance, correctness, depth, and communication.</p>
          </div>
          <button className="secondary-cta" onClick={openInterview}>{interviewOpen ? 'Jump to active interview' : 'Start mock interview'} <ArrowRight size={15} /></button>
        </div>

        {interviewOpen && (
          <section id="interview-workspace" className="interactive-section reveal-on-view">
            <MockInterview analysis={analysis} />
          </section>
        )}

        <div className="journey-controls">
          <button className="journey-next" onClick={() => document.getElementById('goodbye')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Complete the journey <ArrowRight size={15} /></button>
          <span />
        </div>
      </JourneySection>

      <section id="goodbye" className="goodbye-section reveal-on-view">
        <GoodbyeScreen
          candidateName={analysis.resume.candidateName}
          role={analysis.job.role}
          company={analysis.job.company}
          matchPercentage={analysis.skillGap.matchPercentage}
          trainingAttempts={trainingAttempts}
          onRunNewAnalysis={onRunNewAnalysis}
        />
      </section>

      <section className="trace-section reveal-on-view" id="trace">
        <button className="trace-toggle" onClick={() => setTraceOpen((value) => !value)}>
          <div><span className="eyebrow"><Clock3 size={14} /> Agent execution</span><h2>See how your report was assembled.</h2></div>
          <ChevronDown className={traceOpen ? 'rotated' : ''} size={18} />
        </button>
        {traceOpen && (
          <div className="trace-panel">
            <AgentTimeline steps={analysis.agentRun.steps} />
            <div className="trace-meta"><span>{analysis.agentRun.model}</span><span>{(analysis.agentRun.totalDurationMs / 1000).toFixed(2)}s total</span><span>{recentRuns.length} recent local runs</span><span>Session-local only</span></div>
          </div>
        )}
      </section>

      <section className="next-actions reveal-on-view">
        <div><span className="eyebrow"><UserRound size={14} /> Your next actions</span><h2>{analysis.careerPlan.headline}</h2><p>{analysis.careerPlan.summary}</p></div>
        <div className="action-list">{analysis.careerPlan.nextActions.slice(0, 4).map((action, index) => <div key={action}><span>{index + 1}</span>{action}</div>)}</div>
      </section>

      <div className="bottom-note">This session stays in your browser. No candidate profile or job history is stored on a database. <button onClick={onRunNewAnalysis}>Start over</button></div>
    </div>
  );
}

function SignalBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: 'positive' | 'neutral' | 'negative' }) {
  const width = `${Math.min(100, Math.round((value / max) * 100))}%`;
  return <div className="signal-bar"><div><span>{label}</span><strong>{value}</strong></div><div className={`signal-track ${tone}`}><i style={{ width }} /></div></div>;
}

function SkillBucket({ title, values, icon, kind }: { title: string; values: string[]; icon: ReactNode; kind: 'positive' | 'negative' }) {
  return <div className={`skill-bucket ${kind}`}><div className="bucket-title">{icon}<span>{title}</span></div><div className="bucket-tags">{values.length ? values.map((value) => <span key={value}>{value}</span>) : <em>None identified</em>}</div></div>;
}

function SkillColumn({ title, values, muted = false }: { title: string; values: string[]; muted?: boolean }) {
  return <section className={`clean-card skill-column ${muted ? 'muted' : ''}`}><div className="card-heading"><div><span className="overline">Role profile</span><h3>{title}</h3></div><FileText size={16} /></div><div className="plain-tags">{values.length ? values.map((value) => <span key={value}>{value}</span>) : <span className="empty-value">No explicit items</span>}</div></section>;
}

function GoodbyeScreen({
  candidateName,
  role,
  company,
  matchPercentage,
  trainingAttempts,
  onRunNewAnalysis,
}: {
  candidateName: string;
  role: string;
  company: string;
  matchPercentage: number;
  trainingAttempts: Array<{ score: number }>;
  onRunNewAnalysis: () => void;
}) {
  const avgScore = trainingAttempts.length
    ? Math.round(trainingAttempts.reduce((sum, a) => sum + a.score, 0) / trainingAttempts.length)
    : null;

  const CONFETTI_COLORS = ['#ffd500', '#5c677d', '#55725b', '#202020', '#ffee32', '#9b6a2b'];
  const confetti = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 60 - 20,
    size: 6 + Math.random() * 10,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 1.2,
    duration: 2.2 + Math.random() * 1.4,
    rotate: Math.random() * 360,
  }));

  return (
    <div className="goodbye-wrapper">
      <div className="goodbye-confetti" aria-hidden="true">
        {confetti.map(c => (
          <div
            key={c.id}
            className="confetti-piece"
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              width: c.size,
              height: c.size * 0.6,
              background: c.color,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              transform: `rotate(${c.rotate}deg)`,
            }}
          />
        ))}
      </div>

      <div className="goodbye-content">
        <div className="goodbye-badge">
          <PartyPopper size={28} />
        </div>

        <div className="goodbye-stars" aria-hidden="true">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={18}
              fill="#ffd500"
              color="#ffd500"
              style={{ animationDelay: `${i * 0.12}s` }}
              className="goodbye-star"
            />
          ))}
        </div>

        <h2 className="goodbye-headline">
          Well done, {candidateName.split(' ')[0]}! 🎉
        </h2>
        <p className="goodbye-subline">
          You've completed your full placement preparation journey for
          <strong> {role}</strong>{company ? ` at ${company}` : ''}.
        </p>

        <div className="goodbye-stats">
          <div className="goodbye-stat">
            <strong>{matchPercentage}%</strong>
            <span>Role fit score</span>
          </div>
          <div className="goodbye-stat-divider" />
          {avgScore != null ? (
            <div className="goodbye-stat">
              <strong>{avgScore}/100</strong>
              <span>Practice average</span>
            </div>
          ) : (
            <div className="goodbye-stat">
              <strong>{trainingAttempts.length}</strong>
              <span>Questions practiced</span>
            </div>
          )}
          <div className="goodbye-stat-divider" />
          <div className="goodbye-stat">
            <strong>7/7</strong>
            <span>Journey steps</span>
          </div>
        </div>

        <div className="goodbye-message">
          <p>
            You've mapped the role, identified your gaps, reviewed focus areas, explored assessment signals,
            studied example questions, practiced with AI-generated MCQs, and completed a mock interview.
            That's exactly the kind of deliberate preparation that makes a difference.
          </p>
          <p>
            Go get that offer. You're ready. 🚀
          </p>
        </div>

        <div className="goodbye-actions">
          <button className="launch-button" onClick={onRunNewAnalysis}>
            Analyze another role <ArrowRight size={16} />
          </button>
        </div>

        <div className="goodbye-smiley" aria-label="A smiley celebrating your progress" role="img">
          <div className="smiley-face">
            <span className="smiley-eye smiley-eye-left" />
            <span className="smiley-eye smiley-eye-right" />
            <span className="smiley-mouth" />
            <span className="smiley-cheek smiley-cheek-left" />
            <span className="smiley-cheek smiley-cheek-right" />
            <span className="smiley-shine" />
          </div>
          <span className="smiley-shadow" />
        </div>
      </div>
    </div>
  );
}

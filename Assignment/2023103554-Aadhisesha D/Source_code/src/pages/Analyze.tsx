import { useRef, useState } from 'react';
import { ArrowRight, FileText, LockKeyhole, Sparkles, UploadCloud } from 'lucide-react';
import type { PlacementAnalysis, PlacementRequest } from '../types/placement';
import { extractTextFromFile } from '../utils/fileParser';

export function Analyze({ onRun, running }: { analysis?: PlacementAnalysis; onRun: (request: PlacementRequest) => Promise<void>; running: boolean; onNavigate?: () => void }) {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [careerGoal, setCareerGoal] = useState('Software Engineer');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const loadFile = async (file?: File) => {
    if (!file) return;
    setError('');
    try {
      const text = await extractTextFromFile(file);
      setResumeText(text);
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read this file.');
    }
  };

  const submit = async () => {
    setError('');
    if (resumeText.trim().length < 80) return setError('Add a little more resume content or upload a text-based PDF.');
    if (jobDescription.trim().length < 80) return setError('Paste a fuller job description so the role analysis has enough evidence.');
    if (careerGoal.trim().length < 2) return setError('Add the career goal you are targeting.');
    await onRun({ resumeText: resumeText.trim(), jobDescription: jobDescription.trim(), careerGoal: careerGoal.trim() });
  };

  return <div className="entry-page">
    <section className="entry-hero reveal">
      <div className="entry-copy">
        <span className="eyebrow"><Sparkles size={14} /> Career intelligence for the next interview</span>
        <h1>Understand the role.<br /><em>Train for the role.</em></h1>
        <p>Give PlacementPilot your resume and the job description. Its agents will map the opportunity, identify your gaps and build the practice path around the job.</p>
        <div className="entry-points"><span><span className="point-dot" /> role analysis</span><span><span className="point-dot" /> skill-gap map</span><span><span className="point-dot" /> adaptive practice</span></div>
      </div>
      <div className="entry-signal" aria-hidden="true">
        <div className="visual-scene">
          <div className="visual-platform" />
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
          <div className="visual-object">
            <div className="visual-object__side" />
            <div className="visual-object__front">
              <span className="visual-object__highlight" />
              <span className="visual-arrow">↑</span>
            </div>
          </div>
          <span className="visual-decoration decoration-one" />
          <span className="visual-decoration decoration-two" />
          <span className="signal-caption">career navigation</span>
        </div>
      </div>
    </section>

    <section className="entry-form-card reveal">
      <div className="entry-form-head"><div><span className="overline">Start a placement analysis</span><h2>Bring the evidence. We'll build the map.</h2></div><span className="privacy-note"><LockKeyhole size={13} /> session-local</span></div>
      <div className="entry-grid">
        <div className="form-column">
          <label className="input-label">Your resume</label>
          <button className="file-drop" onClick={() => inputRef.current?.click()} type="button">
            <span className="file-icon"><UploadCloud size={17} /></span>
            <span><strong>{fileName || 'Upload a resume PDF'}</strong><small>{fileName ? 'Text extracted locally' : 'PDF or TXT · nothing is stored remotely'}</small></span>
            <input ref={inputRef} hidden type="file" accept="application/pdf,text/plain,.pdf,.txt" onChange={(event) => loadFile(event.target.files?.[0])} />
          </button>
          <textarea className="entry-textarea" value={resumeText} onChange={(event) => setResumeText(event.target.value)} placeholder="Or paste your resume text here..." rows={13} />
          <div className="field-meta"><span><FileText size={12} /> {resumeText.length.toLocaleString()} characters</span><span>Candidate evidence</span></div>
        </div>
        <div className="form-column">
          <label className="input-label">Target role</label>
          <input className="entry-input" value={careerGoal} onChange={(event) => setCareerGoal(event.target.value)} placeholder="Software Engineer" />
          <label className="input-label job-label">Job description</label>
          <textarea className="entry-textarea tall" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} placeholder="Paste the complete job description, responsibilities and requirements..." rows={18} />
          <div className="field-meta"><span>Role evidence</span><span>{jobDescription.length.toLocaleString()} characters</span></div>
        </div>
      </div>
      {error && <div className="inline-error">{error}</div>}
      <div className="entry-submit-row"><span>One request → a coordinated multi-agent report.</span><button className="launch-button" disabled={running} onClick={submit}>{running ? <><Sparkles className="spin" size={15} /> Agents are working</> : <>Build my role map <ArrowRight size={16} /></>}</button></div>
    </section>
  </div>;
}

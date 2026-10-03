import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Bot,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Clock3,
  FileArchive,
  FileCode2,
  GitBranch,
  Layers3,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  analyzeGitHubRepository,
  getAnalysis,
  getHealth,
  triggerAiReview,
  uploadRepository,
  type AnalysisResult,
  type Finding,
  type HealthResponse,
} from "./services/api";

type Section = "overview" | "findings" | "architecture" | "ai";

const sections: Array<{ id: Section; label: string; icon: typeof Activity }> = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "findings", label: "Findings", icon: Search },
  { id: "architecture", label: "Architecture", icon: GitBranch },
  { id: "ai", label: "AI review", icon: Sparkles },
];

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [mode, setMode] = useState<"upload" | "github">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("Ready to analyze");
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealthError(true));
  }, []);

  const filteredFindings = useMemo(() => {
    if (!analysis) return [];
    const needle = query.trim().toLowerCase();
    return analysis.findings.filter((finding) => {
      const matchesQuery = !needle ||
        `${finding.type} ${finding.file} ${finding.message}`.toLowerCase().includes(needle);
      const matchesSeverity = severityFilter === "all" || finding.severity.toLowerCase() === severityFilter;
      return matchesQuery && matchesSeverity;
    });
  }, [analysis, query, severityFilter]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAnalysis(null);
    setSelectedFinding(null);
    setLoading(true);
    setProgress("Validating repository and preparing static analysis…");
    try {
      const ingested = mode === "upload"
        ? file
          ? await uploadRepository(file)
          : (() => { throw new Error("Choose a ZIP repository to analyze."); })()
        : githubUrl.trim()
          ? await analyzeGitHubRepository(githubUrl.trim())
          : (() => { throw new Error("Enter a public GitHub repository URL."); })();
      setProgress("Loading deterministic analysis results…");
      const result = await getAnalysis(ingested.analysis_id);
      setAnalysis(result);
      setSection("overview");
      setProgress("Analysis completed");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Analysis could not be completed.");
      setProgress("Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setError(null);
  }

  if (analysis) {
    return (
      <Dashboard
        analysis={analysis}
        onAnalysisUpdate={(update) => setAnalysis((current) => current ? { ...current, ...update } : current)}
        section={section}
        setSection={setSection}
        onBack={() => { setAnalysis(null); setSelectedFinding(null); setError(null); }}
        selectedFinding={selectedFinding}
        setSelectedFinding={setSelectedFinding}
        filteredFindings={filteredFindings}
        query={query}
        setQuery={setQuery}
        severityFilter={severityFilter}
        setSeverityFilter={setSeverityFilter}
      />
    );
  }

  return (
    <div className="app-shell min-h-screen text-slate-100">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Architecture Reviewer home">
          <span className="brand-mark"><GitBranch size={19} /></span>
          <span><strong>ARCH REVIEW</strong><small>Static analysis workspace</small></span>
        </a>
        <div className={`connection ${health ? "online" : healthError ? "offline" : "checking"}`} aria-live="polite">
          {health ? <CircleCheck size={14} /> : healthError ? <CircleAlert size={14} /> : <Loader2 className="spin" size={14} />}
          {health ? "API connected" : healthError ? "API unavailable" : "Connecting"}
        </div>
      </header>

      <main id="home" className="landing-layout">
        <section className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> PYTHON ARCHITECTURE REVIEW · V1</div>
          <h1>Make your codebase<br /><span>easier to understand.</span></h1>
          <p className="hero-description">
            Upload a Python repository for deterministic structure, metrics, and design signals. Optional AI adds evidence-based context; it never replaces the analyzer.
          </p>
          <div className="principles">
            <div><span className="principle-icon"><ShieldCheck size={17} /></span><span><b>Static only</b><small>Your code is never executed</small></span></div>
            <div><span className="principle-icon"><Layers3 size={17} /></span><span><b>Evidence first</b><small>Findings link back to source</small></span></div>
            <div><span className="principle-icon"><Bot size={17} /></span><span><b>AI is optional</b><small>Review works without a provider</small></span></div>
          </div>
          {health && <p className="api-version">Connected to {health.app_name} · {health.app_env}</p>}
        </section>

        <section className="upload-card" aria-labelledby="upload-heading">
          <div className="card-kicker">NEW ANALYSIS <span>·</span> PYTHON ONLY</div>
          <h2 id="upload-heading">Analyze a repository</h2>
          <p className="card-description">Start with a ZIP archive or a public GitHub URL.</p>
          <div className="mode-tabs" role="tablist" aria-label="Repository source">
            <button type="button" role="tab" aria-selected={mode === "upload"} className={mode === "upload" ? "active" : ""} onClick={() => { setMode("upload"); setError(null); }}><Upload size={15} /> Upload ZIP</button>
            <button type="button" role="tab" aria-selected={mode === "github"} className={mode === "github" ? "active" : ""} onClick={() => { setMode("github"); setError(null); }}><GitBranch size={15} /> GitHub URL</button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "upload" ? (
              <label className={`dropzone ${file ? "has-file" : ""}`} htmlFor="repository-zip">
                <input id="repository-zip" type="file" accept=".zip,application/zip" onChange={handleFileChange} disabled={loading} />
                <span className="drop-icon">{file ? <FileArchive size={22} /> : <Upload size={22} />}</span>
                <strong>{file ? file.name : "Choose a ZIP repository"}</strong>
                <span>{file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB · click to change` : "or drag and drop it here"}</span>
                <em>ZIP archive · source files only · no execution</em>
              </label>
            ) : (
              <label className="url-field" htmlFor="github-url">
                <span>PUBLIC REPOSITORY URL</span>
                <div><GitBranch size={16} /><input id="github-url" type="url" placeholder="https://github.com/owner/repository" value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} disabled={loading} /></div>
                <small>Only public GitHub repositories are supported.</small>
              </label>
            )}
            {error && <div className="form-error" role="alert"><AlertTriangle size={16} />{error}</div>}
            <button className="primary-button" type="submit" disabled={loading || !health}>
              {loading ? <><Loader2 className="spin" size={17} /> Analyzing repository…</> : <>Analyze repository <ArrowUpRight size={17} /> </>}
            </button>
          </form>
          {loading ? (
            <div className="progress-note" role="status"><span className="progress-track"><span /></span><span>{progress}</span></div>
          ) : (
            <div className="privacy-note"><ShieldCheck size={15} /><span>Repository source is inspected as data. No scripts, builds, or package installers are run.</span></div>
          )}
        </section>
      </main>
      <footer className="landing-footer"><span>AI Architecture Reviewer</span><span>Deterministic analysis · Inferred architecture · Optional AI</span></footer>
    </div>
  );
}

function Dashboard({
  analysis,
  onAnalysisUpdate,
  section,
  setSection,
  onBack,
  selectedFinding,
  setSelectedFinding,
  filteredFindings,
  query,
  setQuery,
  severityFilter,
  setSeverityFilter,
}: {
  analysis: AnalysisResult;
  onAnalysisUpdate: (update: Partial<AnalysisResult>) => void;
  section: Section;
  setSection: (section: Section) => void;
  onBack: () => void;
  selectedFinding: Finding | null;
  setSelectedFinding: (finding: Finding | null) => void;
  filteredFindings: Finding[];
  query: string;
  setQuery: (value: string) => void;
  severityFilter: string;
  setSeverityFilter: (value: string) => void;
}) {
  const aiByFinding = new Map(analysis.ai_review.findings.map((item) => [item.finding_id, item]));
  const highCount = analysis.findings.filter((finding) => ["high", "critical"].includes(finding.severity.toLowerCase())).length;
  const statCards = [
    { label: "Python files", value: analysis.repository.python_files, icon: FileCode2, tint: "blue" },
    { label: "Lines of code", value: analysis.metrics.lines_of_code.toLocaleString(), icon: Layers3, tint: "violet" },
    { label: "Classes", value: analysis.metrics.classes, icon: Layers3, tint: "cyan" },
    { label: "Functions", value: analysis.metrics.functions + analysis.metrics.methods, icon: Activity, tint: "green" },
    { label: "Dependencies", value: analysis.dependency_graph.dependency_count, icon: GitBranch, tint: "amber" },
    { label: "Findings", value: analysis.findings.length, icon: AlertTriangle, tint: highCount ? "red" : "slate" },
  ];

  return (
    <div className="dashboard-shell min-h-screen text-slate-100">
      <aside className="sidebar">
        <a className="brand sidebar-brand" href="#dashboard" aria-label="Architecture Reviewer home"><span className="brand-mark"><GitBranch size={19} /></span><span><strong>ARCH REVIEW</strong><small>Analysis workspace</small></span></a>
        <div className="sidebar-label">ANALYSIS</div>
        <nav className="side-nav" aria-label="Analysis sections">
          {sections.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-current={section === id ? "page" : undefined} aria-label={label} className={section === id ? "selected" : ""} onClick={() => { setSection(id); setSelectedFinding(null); }}><Icon size={17} /><span className="nav-label">{label}</span>{id === "findings" && <span className="nav-count">{analysis.findings.length}</span>}</button>
          ))}
        </nav>
        <div className="sidebar-bottom"><div className="sidebar-status"><span className="status-dot" /> Analysis complete</div><small>Static inspection · no execution</small></div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> New analysis</button>
          <div className="topbar-right"><span className="subtle-tag"><ShieldCheck size={14} /> Static only</span><span className="avatar">AR</span></div>
        </header>
        <div className="dashboard-content">
          <div className="project-heading">
            <div><div className="breadcrumb">ANALYSIS <span>/</span> {section.toUpperCase()}</div><h1>{section === "overview" ? analysis.repository.name : sections.find((item) => item.id === section)?.label}</h1><p>{analysis.repository.source} <span className="divider-dot">·</span> completed <span className="divider-dot">·</span> {new Date(analysis.analysis_metadata.completed_at).toLocaleString()}</p></div>
            <div className="inferred-badge"><span /> ARCHITECTURE {analysis.architecture.status}</div>
          </div>

          {section === "overview" && <Overview analysis={analysis} statCards={statCards} setSection={setSection} setSelectedFinding={setSelectedFinding} aiByFinding={aiByFinding} />}
          {section === "findings" && <FindingsView findings={filteredFindings} allCount={analysis.findings.length} query={query} setQuery={setQuery} severityFilter={severityFilter} setSeverityFilter={setSeverityFilter} selectedFinding={selectedFinding} setSelectedFinding={setSelectedFinding} aiByFinding={aiByFinding} />}
          {section === "architecture" && <ArchitectureView analysis={analysis} />}
          {section === "ai" && <AiView analysis={analysis} onAnalysisUpdate={onAnalysisUpdate} />}
        </div>
      </main>
    </div>
  );
}

function Overview({ analysis, statCards, setSection, setSelectedFinding, aiByFinding }: {
  analysis: AnalysisResult;
  statCards: Array<{ label: string; value: number | string; icon: typeof Activity; tint: string }>;
  setSection: (section: Section) => void;
  setSelectedFinding: (finding: Finding | null) => void;
  aiByFinding: Map<string, AnalysisResult["ai_review"]["findings"][number]>;
}) {
  const topFindings = analysis.findings.slice(0, 4);
  return (
    <>
      <section className="stats-grid" aria-label="Project metrics">
        {statCards.map(({ label, value, icon: Icon, tint }) => <article className="stat-card" key={label}><span className={`stat-icon ${tint}`}><Icon size={17} /></span><span className="stat-value">{value}</span><span className="stat-label">{label}</span></article>)}
      </section>
      <div className="content-grid">
        <section className="panel architecture-preview">
          <PanelHeader eyebrow="SYSTEM MAP" title="Inferred architecture" action={<button className="text-action" onClick={() => setSection("architecture")}>Explore architecture <ArrowUpRight size={14} /></button>} />
          <p className="panel-copy">Components are grouped by directory; arrows represent imports found in analyzed files.</p>
          <div className="component-chips">{analysis.architecture.components.map((component) => <span className="component-chip" key={component.name}><Layers3 size={14} />{component.name}<small>{component.files.length} files</small></span>)}</div>
          <div className="relationship-list">{analysis.architecture.relationships.length ? analysis.architecture.relationships.map((edge) => <div className="relationship" key={`${edge.source}:${edge.target}`}><span>{edge.source}</span><ArrowUpRight size={14} /><span>{edge.target}</span><small>{edge.file_dependency_count} import{edge.file_dependency_count === 1 ? "" : "s"}</small></div>) : <div className="empty-inline">No cross-directory imports were resolved.</div>}</div>
        </section>
        <section className="panel quality-panel">
          <PanelHeader eyebrow="STATIC SIGNALS" title="Code quality" action={<button className="text-action" onClick={() => setSection("findings")}>All findings <ArrowUpRight size={14} /></button>} />
          <div className="quality-summary"><strong>{analysis.findings.length}</strong><span>potential findings</span><small>{analysis.findings.filter((item) => item.requires_validation).length} require developer validation</small></div>
          <div className="quality-bars">{["Long Method", "Large Class", "Long Parameter List", "Excessive Coupling", "Circular Dependency"].map((label) => { const count = analysis.findings.filter((finding) => finding.type === label).length; return <div className="quality-row" key={label}><span>{label}</span><span className="quality-track"><i style={{ width: `${analysis.findings.length ? Math.max(4, (count / analysis.findings.length) * 100) : 0}%` }} /></span><b>{count}</b></div>; })}</div>
        </section>
      </div>
      <section className="panel findings-preview">
        <PanelHeader eyebrow="PRIORITY REVIEW" title="Important findings" action={<button className="text-action" onClick={() => setSection("findings")}>Open findings <ArrowUpRight size={14} /></button>} />
        {topFindings.length ? <div className="finding-table">{topFindings.map((finding) => <FindingRow key={finding.id} finding={finding} ai={aiByFinding.get(finding.id)} onClick={() => { setSelectedFinding(finding); setSection("findings"); }} />)}</div> : <EmptyState icon={<Check size={18} />} title="No findings matched" body="The static rules did not identify issues at the configured thresholds." />}
      </section>
      <section className="panel ai-preview">
        <div className="ai-preview-icon"><Sparkles size={19} /></div><div className="ai-preview-copy"><div className="panel-eyebrow">AI REVIEW · {analysis.ai_review.status.toUpperCase()}</div><h2>{analysis.ai_review.summary || "AI interpretation is not available"}</h2><p>{analysis.ai_review.message}</p></div><button className="outline-button" onClick={() => setSection("ai")}>View AI review <ArrowUpRight size={14} /></button>
      </section>
    </>
  );
}

function FindingsView({ findings, allCount, query, setQuery, severityFilter, setSeverityFilter, selectedFinding, setSelectedFinding, aiByFinding }: {
  findings: Finding[];
  allCount: number;
  query: string;
  setQuery: (value: string) => void;
  severityFilter: string;
  setSeverityFilter: (value: string) => void;
  selectedFinding: Finding | null;
  setSelectedFinding: (finding: Finding | null) => void;
  aiByFinding: Map<string, AnalysisResult["ai_review"]["findings"][number]>;
}) {
  return (
    <section className="panel findings-page">
      <PanelHeader eyebrow="DETERMINISTIC + HEURISTIC" title={`${allCount} findings`} />
      <div className="finding-controls"><label className="search-input"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search findings or files" /></label><label className="select-wrap"><span>Severity</span><select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}><option value="all">All levels</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><ChevronDown size={14} /></label></div>
      <div className="finding-table">{findings.map((finding) => <div key={finding.id}><FindingRow finding={finding} ai={aiByFinding.get(finding.id)} onClick={() => setSelectedFinding(selectedFinding?.id === finding.id ? null : finding)} />{selectedFinding?.id === finding.id && <FindingDetail finding={finding} ai={aiByFinding.get(finding.id)} />}</div>)}</div>
      {!findings.length && <EmptyState icon={<Search size={18} />} title="No matching findings" body="Try clearing the text search or severity filter." />}
      <p className="heuristic-disclaimer"><AlertTriangle size={14} /> Findings are static-analysis signals, not proof of a defect or vulnerability. Validate them in the context of the application.</p>
    </section>
  );
}

function FindingDetail({ finding, ai }: { finding: Finding; ai?: AnalysisResult["ai_review"]["findings"][number] }) {
  return (
    <div className="finding-detail">
      <div className="detail-grid"><div><small>WHY IT WAS FLAGGED</small><p>{finding.message}</p></div><div><small>DETECTOR</small><p>{finding.detector}</p></div><div><small>EVIDENCE</small><pre>{JSON.stringify(finding.evidence, null, 2)}</pre></div>{finding.confidence !== null && <div><small>HEURISTIC CONFIDENCE</small><p>{Math.round(finding.confidence * 100)}% · not statistically calibrated</p></div>}</div>
      {finding.source_snippet && <div className="source-block"><small>SOURCE · {finding.file}:{finding.line ?? "—"}</small><pre>{finding.source_snippet.text}</pre></div>}
      {ai ? <div className="ai-detail"><small><Sparkles size={13} /> AI INTERPRETATION</small><p>{ai.explanation}</p><small>ARCHITECTURAL IMPACT</small><p>{ai.architectural_impact}</p><small>RECOMMENDATION</small><p>{ai.recommendation}</p></div> : <div className="ai-not-available">No AI explanation for this finding. Deterministic evidence above remains available.</div>}
    </div>
  );
}

function FindingRow({ finding, ai, onClick }: { finding: Finding; ai?: AnalysisResult["ai_review"]["findings"][number]; onClick: () => void }) {
  const severity = finding.severity.toLowerCase();
  return (
    <button type="button" className="finding-row" onClick={onClick}>
      <span className={`severity-dot ${severity}`} /><span className="finding-main"><strong>{finding.type}</strong><small>{finding.file}:{finding.line ?? "—"}{ai ? " · AI explanation available" : ""}</small></span><span className={`severity-pill ${severity}`}>{finding.severity}</span><ArrowUpRight className="row-arrow" size={15} />
    </button>
  );
}

function ArchitectureView({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="architecture-page">
      <section className="panel"><PanelHeader eyebrow="INFERRED FROM DIRECTORIES + IMPORTS" title="Candidate components" /><p className="panel-copy">The structure below is inferred from file paths and local import edges. It may not match the architecture intended by the project authors.</p><div className="architecture-components">{analysis.architecture.components.map((component) => <article className="architecture-component" key={component.name}><div><Layers3 size={17} /><strong>{component.name}</strong><small>{component.files.length} source files</small></div><ul>{component.files.slice(0, 8).map((path) => <li key={path}><FileCode2 size={13} />{path}</li>)}</ul>{component.files.length > 8 && <small className="more-files">and {component.files.length - 8} more</small>}</article>)}</div></section>
      <section className="panel"><PanelHeader eyebrow="LOCAL IMPORTS" title="Component relationships" /><div className="relationship-list">{analysis.architecture.relationships.length ? analysis.architecture.relationships.map((edge) => <div className="relationship" key={`${edge.source}:${edge.target}`}><span>{edge.source}</span><ArrowUpRight size={14} /><span>{edge.target}</span><small>{edge.file_dependency_count} file edge{edge.file_dependency_count === 1 ? "" : "s"}</small></div>) : <EmptyState icon={<GitBranch size={18} />} title="No cross-component edges" body="Imports found did not cross top-level directory groups." />}</div></section>
      <section className="panel"><PanelHeader eyebrow="GENERATED FROM THE SAME GRAPH" title="Mermaid diagram" /><div className="architecture-svg" dangerouslySetInnerHTML={{ __html: analysis.architecture.svg }} /><details className="diagram-source"><summary>View Mermaid source</summary><pre className="mermaid-source">{analysis.architecture.mermaid}</pre></details><p className="panel-footnote">Deterministic diagram from analyzed imports. Amber nodes/edges indicate detected cycles.</p></section>
      <section className="panel"><PanelHeader eyebrow="CYCLE CHECK" title="Dependency cycles" />{analysis.dependency_graph.cycles.length ? analysis.dependency_graph.cycles.map((cycle, index) => <div className="cycle-row" key={`${index}:${cycle.join(":")}`}><AlertTriangle size={15} /><span>{cycle.join(" ↔ ")}</span></div>) : <div className="success-inline"><CircleCheck size={16} /> No import cycles detected among resolved local files.</div>}</section>
    </div>
  );
}

function AiView({ analysis, onAnalysisUpdate }: { analysis: AnalysisResult; onAnalysisUpdate: (update: Partial<AnalysisResult>) => void }) {
  const review = analysis.ai_review;
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const findingsById = new Map(analysis.findings.map((finding) => [finding.id, finding]));
  async function runReview() {
    setReviewLoading(true); setReviewError(null);
    try { onAnalysisUpdate({ ai_review: await triggerAiReview(analysis.analysis_id) }); }
    catch (error) { setReviewError(error instanceof Error ? error.message : "Gemini review failed."); }
    finally { setReviewLoading(false); }
  }
  return (
    <div className="ai-page">
      <section className="ai-status-card"><div className="ai-status-icon"><Sparkles size={21} /></div><div><div className="panel-eyebrow">OPTIONAL AI INTERPRETATION · {review.status.toUpperCase()}</div><h2>{review.summary || "Deterministic review remains available"}</h2><p>{review.message}</p>{reviewError && <p role="alert">{reviewError}</p>}</div><span className={`ai-status-pill ${review.status === "completed" ? "ready" : "muted"}`}>{review.status === "completed" ? <Check size={13} /> : <Clock3 size={13} />}{review.status.replace(/_/g, " ")}</span><button type="button" className="outline-button" onClick={runReview} disabled={reviewLoading}>{reviewLoading ? <><Loader2 className="spin" size={14} /> Reviewing…</> : "Run AI review"}</button></section>
      {review.architecture_summary && <section className="panel"><PanelHeader eyebrow="ARCHITECTURE CONTEXT" title="AI summary" /><p className="ai-prose">{review.architecture_summary}</p></section>}
      <section className="panel"><PanelHeader eyebrow="EVIDENCE-LINKED" title="Finding explanations" />{review.findings.length ? <div className="ai-explanations">{review.findings.map((item) => { const finding = findingsById.get(item.finding_id); return <article className="ai-explanation" key={item.finding_id}><div className="ai-explanation-heading"><Sparkles size={15} /><div><strong>{finding?.type ?? item.finding_id}</strong><small>{finding ? `${finding.file}:${finding.line ?? "—"}` : "Finding reference"}</small></div></div><p>{item.explanation}</p><div className="impact-recommendation"><div><small>ARCHITECTURAL IMPACT</small><p>{item.architectural_impact}</p></div><div><small>RECOMMENDATION</small><p>{item.recommendation}</p></div></div></article>; })}</div> : <EmptyState icon={<Bot size={18} />} title="No AI explanations returned" body="Configure the single supported provider to add contextual explanations. Static findings do not depend on AI." />}</section>
      <section className="panel"><PanelHeader eyebrow="SUGGESTED NEXT STEPS" title="Overall recommendations" />{review.overall_recommendations.length ? <ol className="recommendation-list">{review.overall_recommendations.map((item, index) => <li key={`${index}:${item}`}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}</ol> : <p className="panel-copy">Recommendations will appear when a valid AI review is available.</p>}</section>
      {review.raw_text && <section className="panel"><PanelHeader eyebrow="UNPARSED PROVIDER OUTPUT" title="Raw response" /><pre className="mermaid-source">{review.raw_text}</pre></section>}
      <p className="ai-disclaimer"><ShieldCheck size={15} /> AI commentary is based only on selected static evidence and may be wrong. Verify suggestions before making changes.</p>
    </div>
  );
}

function PanelHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <div className="panel-header"><div><div className="panel-eyebrow">{eyebrow}</div><h2>{title}</h2></div>{action}</div>;
}

function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return <div className="empty-state"><span>{icon}</span><strong>{title}</strong><p>{body}</p></div>;
}

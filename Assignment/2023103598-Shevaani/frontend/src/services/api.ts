export interface HealthResponse {
  status: string;
  app_name: string;
  app_version: string;
  app_env: string;
  ai_analysis_enabled: boolean;
}

export interface IngestionResponse {
  ingestion_id: string;
  analysis_id: string;
  analysis_status: string;
  repository_name: string;
  source: string;
  files: number;
  python_files: number;
  warnings: string[];
  analysis_started: boolean;
  message: string;
}

export interface Finding {
  id: string;
  type: string;
  file: string;
  line: number | null;
  line_end: number | null;
  severity: string;
  confidence: number | null;
  status: string;
  message: string;
  detector: string;
  evidence: Record<string, unknown>;
  requires_validation: boolean;
  source_snippet: { line_start: number; line_end: number; text: string } | null;
}

export interface AiFindingReview {
  finding_id: string;
  explanation: string;
  architectural_impact: string;
  recommendation: string;
}

export interface AiReview {
  status: string;
  summary: string;
  findings: AiFindingReview[];
  architecture_summary: string;
  overall_recommendations: string[];
  raw_text: string | null;
  message: string;
  major_concerns?: Array<Record<string, unknown>>;
  refactoring_recommendations?: Array<Record<string, unknown>>;
  false_positive_candidates?: Array<Record<string, unknown>>;
}

export interface AnalysisResult {
  analysis_id: string;
  repository: {
    name: string;
    source: string;
    status: string;
    python_files: number;
    files: number;
    warnings: string[];
  };
  metrics: {
    files: number;
    lines_of_code: number;
    classes: number;
    functions: number;
    methods: number;
    imports: number;
    function_metrics: Array<{
      file: string;
      name: string;
      line_start: number;
      line_end: number;
      is_method: boolean;
      parameter_count: number;
      complexity: number;
    }>;
    file_metrics: Array<Record<string, unknown>>;
  };
  findings: Finding[];
  dependency_graph: {
    dependency_count: number;
    edges: Array<{ source: string; target: string; import_lines: number[] }>;
    fan_in: Record<string, number>;
    fan_out: Record<string, number>;
    cycles: string[][];
  };
  architecture: {
    status: string;
    components: Array<{ name: string; files: string[] }>;
    relationships: Array<{ source: string; target: string; file_dependency_count: number }>;
    mermaid: string;
    svg: string;
  };
  parser_errors: Array<{ file: string; error: string }>;
  analysis_metadata: {
    completed_at: string;
    code_executed: boolean;
    heuristic_thresholds: Record<string, number>;
    limitations: string[];
  };
  ai_review: AiReview;
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch("/api/health");
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`);
  }
  return response.json();
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return typeof body.detail === "string" ? body.detail : `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

export async function uploadRepository(file: File): Promise<IngestionResponse> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/analyze/upload", { method: "POST", body: form });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json();
}

export async function analyzeGitHubRepository(url: string): Promise<IngestionResponse> {
  const response = await fetch("/api/analyze/github", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json();
}

export async function getAnalysis(analysisId: string): Promise<AnalysisResult> {
  const response = await fetch(`/api/analysis/${encodeURIComponent(analysisId)}`);
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json();
}

export async function triggerAiReview(analysisId: string): Promise<AiReview> {
  const response = await fetch(`/api/analysis/${encodeURIComponent(analysisId)}/ai-review`, { method: "POST" });
  if (!response.ok) throw new Error(await errorMessage(response));
  return response.json();
}


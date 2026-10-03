"""Synchronous in-memory orchestration of the deterministic analyzer."""
from __future__ import annotations

from dataclasses import asdict
from datetime import UTC, datetime
import logging
from pathlib import Path
from threading import Lock
import time
import tracemalloc
from typing import Any

from app.analyzer.architecture import infer_architecture
from app.analyzer.detectors import (
    analyze_performance,
    analyze_security,
    analyze_solid,
    detect_smells,
    thresholds_from_settings,
)
from app.analyzer.graph import build_dependency_graph
from app.analyzer.llm.review_service import ai_review_initial_state, generate_ai_review, generate_architecture_image
from app.analyzer.metrics import calculate_metrics
from app.analyzer.parser import PythonAstParser
from app.core.config import Settings
from app.services.repository_ingestion import IngestionResult

logger = logging.getLogger(__name__)
_PROFILE_LOCK = Lock()


class AnalysisService:
    """Run parse → metrics → graph → heuristics → inferred architecture."""

    def __init__(self) -> None:
        self._analyses: dict[str, dict[str, Any]] = {}
        self._reports: dict[str, str] = {}
        self._lock = Lock()

    def analyze(
        self,
        ingestion: IngestionResult,
        repository_root: Path,
        settings: Settings,
    ) -> dict[str, Any]:
        # tracemalloc is process-global; serialize and isolate this measurement window.
        with _PROFILE_LOCK:
            was_tracing = tracemalloc.is_tracing()
            if not was_tracing:
                tracemalloc.start()
            else:
                tracemalloc.reset_peak()

            started = time.perf_counter()
            try:
                result = self._analyze(ingestion, repository_root, settings)
            finally:
                elapsed = time.perf_counter() - started
                _, peak_bytes = tracemalloc.get_traced_memory()
                if not was_tracing:
                    tracemalloc.stop()

        performance = result["performance"]
        performance["timings"]["total_static_analysis_seconds"] = elapsed
        performance["throughput"] = _throughput(result, elapsed)
        performance["execution_metrics"] = _execution_metrics(ingestion, result, elapsed)
        performance["python_heap_peak_mb"] = round(peak_bytes / (1024 * 1024), 2)
        performance["memory_measurement"] = (
            "tracemalloc peak reset for this static analysis window; tracing was globally active"
            if was_tracing
            else "tracemalloc peak during static analysis window"
        )
        self._print_performance(ingestion, result)
        with self._lock:
            self._analyses[ingestion.ingestion_id] = result
            self._reports[ingestion.ingestion_id] = _render_report(result)
        return result

    def _analyze(
        self,
        ingestion: IngestionResult,
        repository_root: Path,
        settings: Settings,
    ) -> dict[str, Any]:
        timings: dict[str, float] = {}
        
        stage_started = time.perf_counter()
        parsed_files = PythonAstParser().parse_directory(repository_root)
        timings["ast_parsing_seconds"] = time.perf_counter() - stage_started
        
        stage_started = time.perf_counter()
        metrics = calculate_metrics(parsed_files)
        timings["metric_calculation_seconds"] = time.perf_counter() - stage_started
        
        stage_started = time.perf_counter()
        graph = build_dependency_graph(parsed_files)
        timings["dependency_graph_seconds"] = time.perf_counter() - stage_started
        
        thresholds = thresholds_from_settings(settings)
        stage_started = time.perf_counter()
        smell_findings = detect_smells(parsed_files, metrics, graph, thresholds)
        timings["code_smell_detection_seconds"] = time.perf_counter() - stage_started
        
        stage_started = time.perf_counter()
        solid_findings = analyze_solid(
            parsed_files,
            graph,
            wide_interface_methods=settings.wide_interface_methods,
        )
        timings["solid_analysis_seconds"] = time.perf_counter() - stage_started
        
        findings = [
            *smell_findings,
            *solid_findings,
            *analyze_security(parsed_files),
            *analyze_performance(
                parsed_files,
                metrics,
                high_complexity=settings.high_complexity,
            ),
        ]
        findings.sort(key=lambda item: (item.file.casefold(), item.line or 0, item.type))
        timings["finding_detection_seconds"] = time.perf_counter() - stage_started
        
        stage_started = time.perf_counter()
        architecture = infer_architecture(graph)
        timings["architecture_recovery_seconds"] = time.perf_counter() - stage_started
        
        finding_results = [
            {
                **asdict(finding),
                "category": finding.category,
                "source_snippet": _source_snippet(repository_root, finding.file, finding.line, finding.line_end),
            }
            for finding in findings
        ]
        parser_errors = [
            {"file": parsed.filename, "error": parsed.parse_error}
            for parsed in parsed_files
            if parsed.parse_error
        ]
        result = {
            "analysis_id": ingestion.ingestion_id,
            "repository": {
                "name": ingestion.repository_name,
                "source": ingestion.source,
                "status": "COMPLETED",
                "python_files": len(parsed_files),
                "files": metrics.files,
                "warnings": ingestion.warnings,
            },
            "metrics": asdict(metrics),
            "findings": finding_results,
            "dependency_graph": {
                "dependency_count": graph.dependency_count,
                "edges": [asdict(edge) for edge in graph.edges],
                "fan_in": graph.fan_in,
                "fan_out": graph.fan_out,
                "cycles": graph.cycles,
            },
            "architecture": asdict(architecture),
            "parser_errors": parser_errors,
            "analysis_metadata": {
                "completed_at": datetime.now(UTC).isoformat(),
                "code_executed": False,
                "heuristic_thresholds": {
                    "long_method_lines": settings.long_method_lines,
                    "large_class_methods": settings.large_class_methods,
                    "long_parameter_count": settings.long_parameter_count,
                    "high_fan_out": settings.high_fan_out,
                    "high_complexity": settings.high_complexity,
                    "wide_interface_methods": settings.wide_interface_methods,
                },
                "limitations": [
                    "Static heuristics indicate candidates and do not prove design violations, vulnerabilities, or runtime performance.",
                    "Dependency edges represent imports resolved to files in this repository only.",
                    "Architecture components are grouped by top-level directory and are inferred from static imports.",
                ],
            },
            "performance": {
                "timings": {**ingestion.timings, **timings},
                "throughput": {},
                "python_heap_peak_mb": None,
                "memory_measurement": "tracemalloc peak of Python allocations; not process RSS",
            },
        }
        result["ai_review"] = ai_review_initial_state(settings)
        return result

    @staticmethod
    def _print_performance(ingestion: IngestionResult, result: dict[str, Any]) -> None:
        timings = result["performance"]["timings"]
        execution = result["performance"]["execution_metrics"]
        ingestion_keys = ("archive_download_seconds", "upload_staging_seconds", "archive_extraction_seconds")
        ingestion_duration = sum(ingestion.timings.get(key, 0.0) for key in ingestion_keys)
        ingestion_label = f"{ingestion_duration:.3f} sec" if any(key in ingestion.timings for key in ingestion_keys) else "N/A"
        rows = [
            "",
            "=" * 68,
            "AI ARCHITECTURE REVIEWER — ANALYSIS PERFORMANCE",
            "=" * 68,
            f"Repository:\n{ingestion.repository_name}",
            f"\nFiles processed:\n{execution['files_processed']}",
            f"\nPython files:\n{execution['python_files']}",
            f"\nLines of code:\n{execution['lines_of_code']}",
            f"\nTotal execution time:\n{execution['total_execution_seconds']:.3f} seconds",
            f"\nFiles / second:\n{execution['files_per_second']}",
            f"\nTime / file:\n{execution['seconds_per_file']}",
            f"\nLOC / second:\n{execution['loc_per_second']}",
            f"\nTime / 1,000 LOC:\n{execution['seconds_per_1000_loc']}",
            "\nPIPELINE TIMINGS",
            f"Repository ingestion: {ingestion_label}",
            f"AST parsing: {timings['ast_parsing_seconds']:.3f} sec",
            f"Metrics: {timings['metric_calculation_seconds']:.3f} sec",
            f"Dependency graph: {timings['dependency_graph_seconds']:.3f} sec",
            f"Code smell detection: {timings['code_smell_detection_seconds']:.3f} sec",
            f"SOLID analysis: {timings['solid_analysis_seconds']:.3f} sec",
            "Design-pattern analysis: N/A (stage is not implemented)",
            f"Architecture inference: {timings['architecture_recovery_seconds']:.3f} sec",
            f"Total static analysis: {timings['total_static_analysis_seconds']:.3f} sec",
            "=" * 68,
            "",
        ]
        print("\n".join(rows), flush=True)

    def trigger_ai_review(self, analysis_id: str, settings: Settings) -> dict[str, Any] | None:
        """Run Gemini only on explicit request, then update the in-memory result/report."""
        with self._lock:
            analysis = self._analyses.get(analysis_id)
        if analysis is None:
            return None
        review = generate_ai_review(analysis, settings)
        with self._lock:
            current = self._analyses.get(analysis_id)
            if current is None:
                return None
            current["ai_review"] = review
            self._reports[analysis_id] = _render_report(current)
            return review

    def generate_architecture_image(self, analysis_id: str, settings: Settings) -> dict[str, Any] | None:
        with self._lock:
            analysis = self._analyses.get(analysis_id)
        if analysis is None:
            return None
        return generate_architecture_image(analysis, settings)

    def get_analysis(self, analysis_id: str) -> dict[str, Any] | None:
        with self._lock:
            return self._analyses.get(analysis_id)

    def get_findings(self, analysis_id: str) -> list[dict[str, Any]] | None:
        result = self.get_analysis(analysis_id)
        return result["findings"] if result else None

    def get_architecture(self, analysis_id: str) -> dict[str, Any] | None:
        result = self.get_analysis(analysis_id)
        if result is None:
            return None
        return {
            "status": result["architecture"]["status"],
            "components": result["architecture"]["components"],
            "relationships": result["architecture"]["relationships"],
            "mermaid": result["architecture"]["mermaid"],
            "dependency_graph": result["dependency_graph"],
        }

    def get_report(self, analysis_id: str) -> str | None:
        with self._lock:
            return self._reports.get(analysis_id)

    def cleanup(self) -> None:
        with self._lock:
            self._analyses.clear()
            self._reports.clear()


def _render_report(result: dict[str, Any]) -> str:
    repository = result["repository"]
    metrics = result["metrics"]
    architecture = result["architecture"]
    lines = [
        f"# Static Analysis Report: {repository['name']}",
        "",
        f"Analysis ID: {result['analysis_id']}",
        f"Source: {repository['source']}",
        "",
        "## Project summary",
        f"- Python files: {repository['python_files']}",
        f"- Classes: {metrics['classes']}",
        f"- Functions: {metrics['functions']}",
        f"- Methods: {metrics['methods']}",
        f"- Lines of code: {metrics['lines_of_code']}",
        f"- Imports: {metrics['imports']}",
        f"- Local dependencies: {result['dependency_graph']['dependency_count']}",
        "",
        "## Findings",
    ]
    if result["findings"]:
        for finding in result["findings"]:
            location = f"{finding['file']}:{finding['line']}" if finding["line"] else finding["file"]
            lines.append(f"- **{finding['type']}** ({finding['severity']}) at `{location}` — {finding['message']}")
            lines.append(f"  Evidence: `{finding['evidence']}`")
    else:
        lines.append("- No findings matched the configured heuristic rules.")
    ai_review = result.get("ai_review", {})
    lines.extend(["", "## AI review", f"Status: {ai_review.get('status', 'not_configured')}"])
    if ai_review.get("summary"):
        lines.append(ai_review["summary"])
    if ai_review.get("architecture_summary"):
        lines.extend(["", "Architecture interpretation:", ai_review["architecture_summary"]])
    ai_finding_reviews = {item["finding_id"]: item for item in ai_review.get("findings", [])}
    if ai_finding_reviews:
        lines.extend(["", "Finding explanations:"])
        for finding_id, explanation in ai_finding_reviews.items():
            lines.append(f"- **{finding_id}**: {explanation['explanation']}")
            if explanation["architectural_impact"]:
                lines.append(f"  Architectural impact: {explanation['architectural_impact']}")
            if explanation["recommendation"]:
                lines.append(f"  Recommendation: {explanation['recommendation']}")
    if ai_review.get("overall_recommendations"):
        lines.extend(["", "Recommendations:"])
        lines.extend(f"- {item}" for item in ai_review["overall_recommendations"])
    lines.extend(
        [
            "",
            "## Inferred architecture",
            f"Status: {architecture['status']}",
            "",
            "```mermaid",
            architecture["mermaid"],
            "```",
            "",
            "## Limitations",
            *[f"- {item}" for item in result["analysis_metadata"]["limitations"]],
            "- Repository code was not executed.",
        ]
    )
    return "\n".join(lines)


def _source_snippet(repository_root: Path, filename: str, line: int | None, line_end: int | None) -> dict[str, Any] | None:
    if line is None or line < 1:
        return None
    candidate = (repository_root / Path(filename)).resolve()
    if not candidate.is_relative_to(repository_root.resolve()) or not candidate.is_file():
        return None
    try:
        lines = candidate.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return None
    if line > len(lines):
        return None
    start = max(1, line - 2)
    requested_end = line_end if line_end is not None else line + 2
    end = min(len(lines), max(line + 2, requested_end), start + 19)
    return {
        "line_start": start,
        "line_end": end,
        "text": "\n".join(f"{index}: {lines[index - 1]}" for index in range(start, end + 1)),
    }


def _throughput(result: dict[str, Any], elapsed_seconds: float) -> dict[str, float]:
    duration = max(elapsed_seconds, 1e-9)
    metrics = result["metrics"]
    return {
        "python_files_per_second": round(metrics["files"] / duration, 2),
        "lines_of_code_per_second": round(metrics["lines_of_code"] / duration, 2),
        "findings_per_second": round(len(result["findings"]) / duration, 2),
    }


def _execution_metrics(ingestion: IngestionResult, result: dict[str, Any], elapsed: float) -> dict[str, Any]:
    files = ingestion.files
    python_files = result["repository"]["python_files"]
    loc = result["metrics"]["lines_of_code"]
    duration = max(elapsed, 1e-12)
    
    return {
        "files_processed": files,
        "python_files": python_files,
        "lines_of_code": loc,
        "total_execution_seconds": round(elapsed, 6),
        "files_per_second": round(files / duration, 2),
        "seconds_per_file": round(elapsed / files, 6) if files > 0 else "N/A",
        "loc_per_second": round(loc / duration, 2),
        "seconds_per_1000_loc": round((elapsed * 1000) / loc, 6) if loc > 0 else "N/A",
    }
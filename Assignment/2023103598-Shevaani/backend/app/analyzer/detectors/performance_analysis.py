"""Static indicators for potentially expensive Python code shapes."""
from __future__ import annotations

from app.analyzer.detectors.basic_smells import Finding
from app.analyzer.metrics.basic_metrics import ProjectMetrics
from app.analyzer.parser.python_parser import FunctionInfo, ParsedPythonFile


def analyze_performance(
    parsed_files: list[ParsedPythonFile],
    metrics: ProjectMetrics,
    *,
    high_complexity: int = 15,
) -> list[Finding]:
    """Report complexity, nested loops, and selected calls made inside loops.

    These are source-shape indicators only; no runtime cost is measured.
    """
    metric_lookup = {
        (metric.file, metric.name, metric.line_start): metric
        for metric in metrics.function_metrics
    }
    findings: list[Finding] = []
    for parsed in sorted(parsed_files, key=lambda item: item.filename.casefold()):
        if parsed.parse_error:
            continue
        for function in _functions(parsed):
            metric = metric_lookup[(parsed.filename, function.qualified_name, function.line_start)]
            if metric.complexity >= high_complexity:
                findings.append(
                    _finding(
                        parsed.filename,
                        function,
                        "high_complexity",
                        {"complexity": metric.complexity, "threshold": high_complexity},
                        "Static complexity is high; review branching and algorithmic work. Runtime performance is not measured.",
                    )
                )
            if function.maximum_loop_depth >= 2:
                findings.append(
                    _finding(
                        parsed.filename,
                        function,
                        "nested_loops",
                        {"maximum_loop_depth": function.maximum_loop_depth},
                        "Nested loops can imply quadratic or higher work depending on collection sizes; validate with profiling.",
                    )
                )
            if function.expensive_calls_in_loops:
                findings.append(
                    _finding(
                        parsed.filename,
                        function,
                        "calls_inside_loop",
                        {"calls": function.expensive_calls_in_loops},
                        "Selected I/O- or query-like calls occur inside a loop and may repeat expensive work.",
                    )
                )
    return findings


def _finding(filename: str, function: FunctionInfo, category: str, evidence: dict, message: str) -> Finding:
    return Finding(
        id=f"PERFORMANCE-{category}:{filename}:{function.qualified_name}:{function.line_start}",
        type=f"Potential performance bottleneck: {category.replace('_', ' ')}",
        file=filename,
        line=function.line_start,
        line_end=function.line_end,
        severity="medium",
        evidence=evidence,
        message=message,
        detector="basic_ast_performance_heuristics",
        status="potential",
        confidence=0.45,
        requires_validation=True,
    )


def _functions(parsed: ParsedPythonFile):
    yield from parsed.functions
    for class_info in parsed.classes:
        yield from class_info.methods

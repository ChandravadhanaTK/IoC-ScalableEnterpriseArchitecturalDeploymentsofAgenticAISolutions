"""Five transparent heuristic code-smell detectors."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterator

from app.analyzer.graph.dependency_graph import DependencyGraph
from app.analyzer.metrics.basic_metrics import ProjectMetrics
from app.analyzer.parser.python_parser import FunctionInfo, ParsedPythonFile


@dataclass(frozen=True)
class SmellThresholds:
    """Initial configurable limits; they are heuristics, not universal rules."""

    long_method_lines: int = 50
    large_class_methods: int = 15
    long_parameter_count: int = 5
    high_fan_out: int = 10
    god_class_methods: int = 20
    god_class_loc: int = 500
    god_class_fan_out: int = 10
    god_class_attributes: int = 15
    god_class_min_signals: int = 3


@dataclass(frozen=True)
class Finding:
    """A deterministic finding with source evidence and detector rationale."""

    id: str
    type: str
    file: str
    line: int | None
    severity: str
    evidence: dict[str, Any]
    message: str
    line_end: int | None = None
    detector: str = "basic_smell_rules"
    status: str = "detected"
    confidence: float | None = None
    requires_validation: bool = False

    @property
    def category(self) -> str:
        """UI distinction between direct rules and heuristic candidates."""
        return "deterministic" if self.status == "detected" else "heuristic/potential"


def thresholds_from_settings(settings: Any) -> SmellThresholds:
    """Create detector thresholds from application settings without global state."""
    return SmellThresholds(
        long_method_lines=settings.long_method_lines,
        large_class_methods=settings.large_class_methods,
        long_parameter_count=settings.long_parameter_count,
        high_fan_out=settings.high_fan_out,
        god_class_methods=settings.god_class_methods,
        god_class_loc=settings.god_class_loc,
        god_class_fan_out=settings.god_class_fan_out,
        god_class_attributes=settings.god_class_attributes,
        god_class_min_signals=settings.god_class_min_signals,
    )


def detect_smells(
    parsed_files: list[ParsedPythonFile],
    metrics: ProjectMetrics,
    dependencies: DependencyGraph,
    thresholds: SmellThresholds | None = None,
) -> list[Finding]:
    """Return the five configured deterministic smell types in stable order."""
    limits = thresholds or SmellThresholds()
    function_metrics = {
        (metric.file, metric.name, metric.line_start): metric
        for metric in metrics.function_metrics
    }
    findings: list[Finding] = []

    for parsed in sorted(parsed_files, key=lambda item: item.filename.casefold()):
        if parsed.parse_error:
            continue
        for function in _functions(parsed):
            metric = function_metrics[(parsed.filename, function.qualified_name, function.line_start)]
            line_span = function.line_end - function.line_start + 1
            if line_span > limits.long_method_lines:
                findings.append(
                    Finding(
                        id=_finding_id("LONG-METHOD", parsed.filename, function.qualified_name, function.line_start),
                        type="Long Method",
                        file=parsed.filename,
                        line=function.line_start,
                        line_end=function.line_end,
                        severity=_severity(line_span, limits.long_method_lines),
                        evidence={"lines": line_span, "complexity": metric.complexity, "threshold": limits.long_method_lines},
                        message="Function or method exceeds the configured line-span threshold.",
                    )
                )
            if metric.parameter_count > limits.long_parameter_count:
                findings.append(
                    Finding(
                        id=_finding_id("LONG-PARAMETERS", parsed.filename, function.qualified_name, function.line_start),
                        type="Long Parameter List",
                        file=parsed.filename,
                        line=function.line_start,
                        line_end=function.line_end,
                        severity=_severity(metric.parameter_count, limits.long_parameter_count),
                        evidence={
                            "parameter_count": metric.parameter_count,
                            "parameters": _explicit_parameter_names(function),
                            "threshold": limits.long_parameter_count,
                        },
                        message="Function or method exceeds the configured parameter-count threshold.",
                    )
                )

        for class_info in parsed.classes:
            method_count = len(class_info.methods)
            if method_count > limits.large_class_methods:
                findings.append(
                    Finding(
                        id=_finding_id("LARGE-CLASS", parsed.filename, class_info.qualified_name, class_info.line_start),
                        type="Large Class",
                        file=parsed.filename,
                        line=class_info.line_start,
                        line_end=class_info.line_end,
                        severity=_severity(method_count, limits.large_class_methods),
                        evidence={
                            "method_count": method_count,
                            "methods": [method.name for method in class_info.methods],
                            "threshold": limits.large_class_methods,
                        },
                        message="Class exceeds the configured method-count threshold.",
                    )
                )

            class_loc = max(1, class_info.line_end - class_info.line_start + 1)
            collaborators = {
                call.split(".")[1]
                for method in class_info.methods
                for call in method.calls
                if call.startswith("self.") and len(call.split(".")) >= 3
            }
            class_fan_out = len(collaborators)
            signals = {
                "method_count": method_count >= limits.god_class_methods,
                "loc": class_loc >= limits.god_class_loc,
                "attribute_count": len(class_info.attributes) >= limits.god_class_attributes,
                "fan_out": class_fan_out >= limits.god_class_fan_out,
            }
            met_signals = [name for name, met in signals.items() if met]
            if len(met_signals) >= limits.god_class_min_signals:
                findings.append(
                    Finding(
                        id=_finding_id("GOD-CLASS-CANDIDATE", parsed.filename, class_info.qualified_name, class_info.line_start),
                        type="Potential God Class",
                        file=parsed.filename,
                        line=class_info.line_start,
                        line_end=class_info.line_end,
                        severity="high" if len(met_signals) == 4 else "medium",
                        evidence={
                            "class": class_info.qualified_name,
                            "loc": class_loc,
                            "method_count": method_count,
                            "attribute_count": len(class_info.attributes),
                            "attributes": class_info.attributes,
                            "collaborators": sorted(collaborators),
                            "fan_in": dependencies.fan_in.get(parsed.filename, 0),
                            "fan_out": class_fan_out,
                            "coupling": class_fan_out,
                            "signals_met": met_signals,
                            "signal_thresholds": {
                                "methods": limits.god_class_methods,
                                "loc": limits.god_class_loc,
                                "attributes": limits.god_class_attributes,
                                "fan_out": limits.god_class_fan_out,
                                "minimum_signals": limits.god_class_min_signals,
                            },
                        },
                        message="Potential God Class: the class exceeds multiple size/coupling thresholds; the rule is a heuristic, not a design verdict.",
                        detector="multi_signal_god_class_heuristic",
                        status="potential",
                        confidence=0.62 if len(met_signals) == 3 else 0.75,
                        requires_validation=True,
                    )
                )

    for filename in sorted(dependencies.graph.nodes, key=str.casefold):
        fan_out = dependencies.fan_out[filename]
        if fan_out > limits.high_fan_out:
            targets = sorted(dependencies.graph.successors(filename), key=str.casefold)
            findings.append(
                Finding(
                    id=_finding_id("EXCESSIVE-COUPLING", filename, "fan-out", 1),
                    type="Excessive Coupling",
                    file=filename,
                    line=1,
                    severity=_severity(fan_out, limits.high_fan_out),
                    evidence={"fan_out": fan_out, "dependencies": targets, "threshold": limits.high_fan_out},
                    message="File imports more local modules than the configured fan-out threshold.",
                )
            )

    for cycle in dependencies.cycles:
        cycle_key = "|".join(cycle)
        findings.append(
            Finding(
                id=_finding_id("CIRCULAR-DEPENDENCY", cycle[0], cycle_key, 1),
                type="Circular Dependency",
                file=cycle[0],
                line=None,
                severity="high",
                evidence={"files": cycle, "dependency_count": sum(dependencies.graph.has_edge(source, target) for source in cycle for target in cycle)},
                message="Local Python imports form a cycle; review the dependency direction.",
            )
        )

    return sorted(findings, key=lambda finding: (finding.file.casefold(), finding.line or 0, finding.type))


def _functions(parsed: ParsedPythonFile) -> Iterator[FunctionInfo]:
    yield from parsed.functions
    for class_info in parsed.classes:
        yield from class_info.methods


def _explicit_parameter_names(function: FunctionInfo) -> list[str]:
    parameters = function.parameters.copy()
    if function.is_method and parameters and parameters[0] in {"self", "cls"}:
        parameters.pop(0)
    return parameters


def _finding_id(rule: str, filename: str, symbol: str, line: int) -> str:
    return f"{rule}:{filename}:{symbol}:{line}"


def _severity(value: int, threshold: int) -> str:
    return "high" if value > threshold * 2 else "medium"

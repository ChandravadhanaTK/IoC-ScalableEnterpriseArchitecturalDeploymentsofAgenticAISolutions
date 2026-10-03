"""Low-confidence structural SOLID review candidates."""
from __future__ import annotations

from app.analyzer.detectors.basic_smells import Finding
from app.analyzer.graph.dependency_graph import DependencyGraph
from app.analyzer.parser.python_parser import ClassInfo, ParsedPythonFile

_PERSISTENCE_METHOD_WORDS = ("save", "store", "insert", "update", "delete", "query", "fetch", "load", "persist")
_VALIDATION_METHOD_WORDS = ("validate", "check", "verify", "sanitize", "is_valid")
_PRESENTATION_METHOD_WORDS = ("render", "format", "serialize", "display", "to_json", "to_html")
_NETWORK_METHOD_WORDS = ("request", "send", "connect", "publish", "download", "upload")
_ORCHESTRATION_METHOD_WORDS = ("process", "handle", "execute", "run", "dispatch", "coordinate")
_HIGH_LEVEL_DIRECTORIES = frozenset({"api", "service", "services", "domain", "business"})
_LOW_LEVEL_DIRECTORIES = frozenset({"db", "database", "repository", "repositories", "persistence", "infrastructure", "infra"})


def analyze_solid(
    parsed_files: list[ParsedPythonFile],
    dependencies: DependencyGraph,
    *,
    wide_interface_methods: int = 10,
) -> list[Finding]:
    """Emit candidates only when simple structural evidence is present.

    These checks cannot prove principle violations. In particular, method
    naming and inheritance are weak signals and every result needs review.
    """
    findings: list[Finding] = []
    classes = [class_info for parsed in parsed_files for class_info in parsed.classes]
    classes_by_name: dict[str, list[ClassInfo]] = {}
    for class_info in classes:
        classes_by_name.setdefault(class_info.name, []).append(class_info)

    for parsed in sorted(parsed_files, key=lambda item: item.filename.casefold()):
        for class_info in parsed.classes:
            _check_srp(parsed.filename, class_info, findings)
            _check_ocp(parsed.filename, class_info, findings)
            _check_isp(parsed.filename, class_info, wide_interface_methods, findings)
            _check_lsp(parsed.filename, class_info, classes_by_name, findings)

    for source, target in sorted(dependencies.graph.edges, key=lambda edge: (edge[0].casefold(), edge[1].casefold())):
        source_directory = _top_directory(source)
        target_directory = _top_directory(target)
        if source_directory in _HIGH_LEVEL_DIRECTORIES and target_directory in _LOW_LEVEL_DIRECTORIES:
            findings.append(
                _candidate(
                    "DIP",
                    source,
                    1,
                    "Potential DIP concern: a higher-level package imports a concrete persistence or infrastructure module.",
                    {
                        "source_package": source_directory,
                        "concrete_dependency": target,
                        "dependency_type": "local import",
                    },
                    0.45,
                )
            )

    return sorted(findings, key=lambda finding: (finding.file.casefold(), finding.line or 0, finding.type))


def _check_srp(filename: str, class_info: ClassInfo, findings: list[Finding]) -> None:
    categories = {
        category
        for method in class_info.methods
        for category, terms in (
            ("persistence", _PERSISTENCE_METHOD_WORDS),
            ("validation", _VALIDATION_METHOD_WORDS),
            ("presentation", _PRESENTATION_METHOD_WORDS),
            ("network", _NETWORK_METHOD_WORDS),
            ("orchestration", _ORCHESTRATION_METHOD_WORDS),
        )
        if any(term in method.name.casefold() for term in terms)
    }
    if len(categories) >= 2:
        findings.append(
            _candidate(
                "SRP",
                filename,
                class_info.line_start,
                f"Potential SRP concern: method names suggest responsibilities in {', '.join(sorted(categories))}.",
                {"class": class_info.qualified_name, "responsibility_name_groups": sorted(categories)},
                0.35,
            )
        )


def _check_ocp(filename: str, class_info: ClassInfo, findings: list[Finding]) -> None:
    dispatch_calls = [
        call
        for method in class_info.methods
        for call in method.calls
        if call.rsplit(".", 1)[-1] in {"isinstance", "type"}
    ]
    if len(dispatch_calls) >= 2:
        findings.append(
            _candidate(
                "OCP",
                filename,
                class_info.line_start,
                "Potential OCP concern: repeated runtime type checks may require modifying this class when adding variants.",
                {"class": class_info.qualified_name, "runtime_type_checks": dispatch_calls},
                0.4,
            )
        )


def _check_isp(
    filename: str,
    class_info: ClassInfo,
    threshold: int,
    findings: list[Finding],
) -> None:
    public_methods = [method.name for method in class_info.methods if not method.name.startswith("_")]
    if len(public_methods) > threshold:
        findings.append(
            _candidate(
                "ISP",
                filename,
                class_info.line_start,
                "Potential ISP concern: the class exposes many public methods; client-specific usage cannot be inferred statically.",
                {"class": class_info.qualified_name, "public_method_count": len(public_methods), "threshold": threshold},
                0.25,
            )
        )


def _check_lsp(
    filename: str,
    class_info: ClassInfo,
    classes_by_name: dict[str, list[ClassInfo]],
    findings: list[Finding],
) -> None:
    child_methods = {method.name for method in class_info.methods}
    for base_expression in class_info.base_classes:
        base_name = base_expression.rsplit(".", 1)[-1]
        for base in classes_by_name.get(base_name, []):
            overridden = sorted(child_methods & {method.name for method in base.methods})
            if overridden:
                findings.append(
                    _candidate(
                        "LSP",
                        filename,
                        class_info.line_start,
                        "Inheritance override detected; behavior compatibility cannot be established by this static check.",
                        {
                            "class": class_info.qualified_name,
                            "base_class": base.qualified_name,
                            "overridden_methods": overridden,
                        },
                        0.2,
                    )
                )
                return


def _candidate(
    principle: str,
    filename: str,
    line: int,
    message: str,
    evidence: dict,
    confidence: float,
) -> Finding:
    return Finding(
        id=f"SOLID-{principle}:{filename}:{line}:{evidence.get('class', evidence.get('concrete_dependency', ''))}",
        type=f"Potential {principle} concern",
        file=filename,
        line=line,
        severity="low",
        evidence=evidence,
        message=message,
        detector="solid_structural_heuristics",
        status="candidate",
        confidence=confidence,
        requires_validation=True,
    )


def _top_directory(filename: str) -> str:
    parts = filename.split("/")
    return parts[0].casefold() if len(parts) > 1 else ""

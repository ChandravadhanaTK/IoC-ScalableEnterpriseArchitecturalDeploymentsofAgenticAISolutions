"""Basic deterministic metrics calculated from parsed Python files."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterator

from app.analyzer.parser.python_parser import FunctionInfo, ParsedPythonFile


@dataclass(frozen=True)
class FunctionMetrics:
    """Basic per-function measures, including class methods."""

    file: str
    name: str
    line_start: int
    line_end: int
    is_method: bool
    parameter_count: int
    complexity: int


@dataclass(frozen=True)
class FileMetrics:
    """Counts and LOC for one parsed Python source file."""

    filename: str
    loc: int
    classes: int
    functions: int
    methods: int
    imports: int


@dataclass(frozen=True)
class ProjectMetrics:
    """Repository summary with detailed per-file and per-function metrics."""

    files: int = 0
    lines_of_code: int = 0
    classes: int = 0
    functions: int = 0
    methods: int = 0
    imports: int = 0
    function_metrics: list[FunctionMetrics] = field(default_factory=list)
    file_metrics: list[FileMetrics] = field(default_factory=list)


def calculate_metrics(parsed_files: list[ParsedPythonFile]) -> ProjectMetrics:
    """Aggregate counts and calculate a simple cyclomatic complexity estimate.

    Complexity uses ``1 + decision_points``. The parser counts each ``if``,
    loop, conditional expression, exception handler, each additional boolean
    operand, each comprehension generator/filter, and non-default match case.
    This is a deterministic structural heuristic, not a measured control-flow
    graph metric. Method parameter counts exclude the conventional ``self`` or
    ``cls`` receiver. Syntax-error files contribute their LOC/file count but
    have no structural counts because they could not be parsed.
    """
    file_metrics: list[FileMetrics] = []
    function_metrics: list[FunctionMetrics] = []
    total_loc = total_classes = total_functions = total_methods = total_imports = 0

    for parsed in parsed_files:
        method_count = sum(len(class_info.methods) for class_info in parsed.classes)
        file_metrics.append(
            FileMetrics(
                filename=parsed.filename,
                loc=parsed.loc,
                classes=len(parsed.classes),
                functions=len(parsed.functions),
                methods=method_count,
                imports=sum(len(item.names) for item in parsed.imports),
            )
        )
        total_loc += parsed.loc
        total_classes += len(parsed.classes)
        total_functions += len(parsed.functions)
        total_methods += method_count
        total_imports += sum(len(item.names) for item in parsed.imports)

        for function in _all_functions(parsed):
            function_metrics.append(_function_metrics(parsed.filename, function))

    return ProjectMetrics(
        files=len(parsed_files),
        lines_of_code=total_loc,
        classes=total_classes,
        functions=total_functions,
        methods=total_methods,
        imports=total_imports,
        function_metrics=function_metrics,
        file_metrics=file_metrics,
    )


def _all_functions(parsed: ParsedPythonFile) -> Iterator[FunctionInfo]:
    yield from parsed.functions
    for class_info in parsed.classes:
        yield from class_info.methods


def _function_metrics(filename: str, function: FunctionInfo) -> FunctionMetrics:
    return FunctionMetrics(
        file=filename,
        name=function.qualified_name,
        line_start=function.line_start,
        line_end=function.line_end,
        is_method=function.is_method,
        parameter_count=function.parameter_count,
        complexity=1 + function.decision_points,
    )

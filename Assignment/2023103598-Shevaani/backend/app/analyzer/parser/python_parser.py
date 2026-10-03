"""Small, non-executing Python source parser built on the standard AST module."""
from __future__ import annotations

import ast
import tokenize
from dataclasses import dataclass, field
from pathlib import Path

_IGNORED_DIRECTORIES = frozenset(
    {
        ".git",
        ".venv",
        "venv",
        "env",
        "node_modules",
        "__pycache__",
        ".pytest_cache",
        ".mypy_cache",
        ".ruff_cache",
        "build",
        "dist",
    }
)


@dataclass
class ImportInfo:
    """One import statement's module and imported names."""

    module: str
    names: list[str] = field(default_factory=list)
    line: int = 0


@dataclass
class SecurityIndicator:
    """A potentially risky AST pattern; it is not proof of exploitability."""

    category: str
    line: int
    evidence: str


@dataclass
class FunctionInfo:
    """A function or method definition and its directly observed calls."""

    name: str
    qualified_name: str
    line_start: int
    line_end: int
    parameters: list[str] = field(default_factory=list)
    calls: list[str] = field(default_factory=list)
    decision_points: int = 0
    maximum_loop_depth: int = 0
    expensive_calls_in_loops: list[str] = field(default_factory=list)
    is_async: bool = False
    is_method: bool = False

    @property
    def parameter_count(self) -> int:
        """Count explicit parameters, excluding the conventional method receiver."""
        receiver = self.is_method and bool(self.parameters) and self.parameters[0] in {"self", "cls"}
        return len(self.parameters) - int(receiver)


@dataclass
class ClassInfo:
    """A class declaration and its direct base expressions and methods."""

    name: str
    qualified_name: str
    line_start: int
    line_end: int
    base_classes: list[str] = field(default_factory=list)
    methods: list[FunctionInfo] = field(default_factory=list)
    attributes: list[str] = field(default_factory=list)


@dataclass
class ParsedPythonFile:
    """Simple file-level structure. LOC counts nonblank, non-comment-only lines."""

    filename: str
    loc: int
    classes: list[ClassInfo] = field(default_factory=list)
    functions: list[FunctionInfo] = field(default_factory=list)
    imports: list[ImportInfo] = field(default_factory=list)
    calls: list[str] = field(default_factory=list)
    security_indicators: list[SecurityIndicator] = field(default_factory=list)
    parse_error: str | None = None


class PythonAstParser:
    """Extract basic Python structure without importing or executing source."""

    def parse_file(self, path: str | Path, repository_root: str | Path | None = None) -> ParsedPythonFile:
        source_path = Path(path)
        filename = self._display_path(source_path, repository_root)
        source = ""
        try:
            with tokenize.open(source_path) as source_file:
                source = source_file.read()
            module = ast.parse(source, filename=filename, type_comments=True)
        except (OSError, UnicodeError, LookupError, SyntaxError, tokenize.TokenError, RecursionError) as error:
            line = getattr(error, "lineno", None)
            message = getattr(error, "msg", str(error))
            location = f" at line {line}" if line else ""
            return ParsedPythonFile(
                filename=filename,
                loc=self._count_loc(source),
                parse_error=f"{type(error).__name__}{location}: {message}",
            )

        result = ParsedPythonFile(filename=filename, loc=self._count_loc(source))
        try:
            _StructureCollector(result).visit(module)
        except RecursionError:
            result.classes.clear()
            result.functions.clear()
            result.imports.clear()
            result.calls.clear()
            result.security_indicators.clear()
            result.parse_error = "RecursionError: source nesting is too deep to inspect safely"
        return result

    def parse_directory(self, repository_root: str | Path) -> list[ParsedPythonFile]:
        """Parse Python files under a directory in stable path order."""
        root = Path(repository_root)
        python_paths = sorted(
            (
                path
                for path in root.rglob("*")
                if path.suffix.lower() == ".py"
                and path.is_file()
                and not path.is_symlink()
                and not any(part.casefold() in _IGNORED_DIRECTORIES for part in path.relative_to(root).parts[:-1])
            ),
            key=lambda path: path.relative_to(root).as_posix().casefold(),
        )
        return [self.parse_file(path, root) for path in python_paths]

    @staticmethod
    def _display_path(path: Path, repository_root: str | Path | None) -> str:
        if repository_root is None:
            return path.as_posix()
        try:
            return path.relative_to(Path(repository_root)).as_posix()
        except ValueError:
            return path.name

    @staticmethod
    def _count_loc(source: str) -> int:
        return sum(
            1
            for line in source.splitlines()
            if line.strip() and not line.lstrip().startswith("#")
        )


class _StructureCollector(ast.NodeVisitor):
    def __init__(self, result: ParsedPythonFile) -> None:
        self.result = result
        self.class_stack: list[ClassInfo] = []
        self.class_function_depths: list[int] = []
        self.function_stack: list[FunctionInfo] = []

    def visit_Import(self, node: ast.Import) -> None:
        for alias in node.names:
            self.result.imports.append(
                ImportInfo(module=alias.name, names=[alias.name], line=node.lineno)
            )

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        module = "." * node.level + (node.module or "")
        self.result.imports.append(
            ImportInfo(module=module, names=[alias.name for alias in node.names], line=node.lineno)
        )

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        parent = self.class_stack[-1].qualified_name if self.class_stack else ""
        qualified_name = f"{parent}.{node.name}" if parent else node.name
        info = ClassInfo(
            name=node.name,
            qualified_name=qualified_name,
            line_start=node.lineno,
            line_end=getattr(node, "end_lineno", node.lineno) or node.lineno,
            base_classes=[self._expression_name(base) for base in node.bases],
        )
        self.result.classes.append(info)
        self.class_stack.append(info)
        self.class_function_depths.append(len(self.function_stack))
        self.generic_visit(node)
        self.class_function_depths.pop()
        self.class_stack.pop()

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self._visit_function(node, is_async=False)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        self._visit_function(node, is_async=True)

    def _visit_function(self, node: ast.FunctionDef | ast.AsyncFunctionDef, *, is_async: bool) -> None:
        direct_method = bool(self.class_stack) and len(self.function_stack) == self.class_function_depths[-1]
        if direct_method:
            parent_name = self.class_stack[-1].qualified_name
        elif self.function_stack:
            parent_name = self.function_stack[-1].qualified_name
        elif self.class_stack:
            parent_name = self.class_stack[-1].qualified_name
        else:
            parent_name = ""
        qualified_name = f"{parent_name}.{node.name}" if parent_name else node.name
        maximum_loop_depth, expensive_calls = _FunctionControlSummary.collect(node)
        info = FunctionInfo(
            name=node.name,
            qualified_name=qualified_name,
            line_start=node.lineno,
            line_end=getattr(node, "end_lineno", node.lineno) or node.lineno,
            parameters=self._parameter_names(node.args),
            decision_points=_DecisionPointCounter.count_for(node),
            maximum_loop_depth=maximum_loop_depth,
            expensive_calls_in_loops=expensive_calls,
            is_async=is_async,
            is_method=direct_method,
        )
        if direct_method:
            self.class_stack[-1].methods.append(info)
        else:
            self.result.functions.append(info)

        self.function_stack.append(info)
        self.generic_visit(node)
        self.function_stack.pop()

    def visit_Call(self, node: ast.Call) -> None:
        call_name = self._expression_name(node.func)
        self.result.calls.append(call_name)
        self._record_call_risks(node, call_name)
        if self.function_stack:
            self.function_stack[-1].calls.append(call_name)
        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign) -> None:
        self._record_class_attributes(node.targets)
        self._record_credential_assignment(node.targets, node.value, node.lineno)
        self.generic_visit(node)

    def visit_AnnAssign(self, node: ast.AnnAssign) -> None:
        self._record_class_attributes([node.target])
        self._record_credential_assignment([node.target], node.value, node.lineno)
        self.generic_visit(node)

    def _record_class_attributes(self, targets: list[ast.expr]) -> None:
        if not self.class_stack:
            return
        class_depth = self.class_function_depths[-1]
        in_class_body = len(self.function_stack) == class_depth
        in_init = bool(self.function_stack) and self.function_stack[-1].name == "__init__"
        if not in_class_body and not in_init:
            return
        for target in targets:
            for node in ast.walk(target):
                if in_class_body and isinstance(node, ast.Name) and not node.id.startswith("_"):
                    name = node.id
                elif (
                    in_init
                    and isinstance(node, ast.Attribute)
                    and isinstance(node.value, ast.Name)
                    and node.value.id in {"self", "cls"}
                ):
                    name = node.attr
                else:
                    continue
                if name not in self.class_stack[-1].attributes:
                    self.class_stack[-1].attributes.append(name)

    def _record_credential_assignment(
        self,
        targets: list[ast.expr],
        value: ast.expr | None,
        line: int,
    ) -> None:
        if not isinstance(value, ast.Constant) or not isinstance(value.value, str) or not value.value:
            return
        secret_terms = ("password", "passwd", "secret", "api_key", "apikey", "access_token")
        names = [node.id.casefold() for target in targets for node in ast.walk(target) if isinstance(node, ast.Name)]
        if any(any(term in name for term in secret_terms) for name in names):
            self.result.security_indicators.append(
                SecurityIndicator(
                    category="hard_coded_credential_candidate",
                    line=line,
                    evidence="String literal assigned to a variable with a credential-like name.",
                )
            )

    def _record_call_risks(self, node: ast.Call, call_name: str) -> None:
        terminal = call_name.rsplit(".", 1)[-1]
        lower_name = call_name.casefold()
        indicator: tuple[str, str] | None = None
        if terminal in {"eval", "exec"}:
            indicator = ("dynamic_code_execution", f"Call to {terminal}().")
        elif lower_name.startswith("subprocess.") and any(
            keyword.arg == "shell" and isinstance(keyword.value, ast.Constant) and keyword.value.value is True
            for keyword in node.keywords
        ):
            indicator = ("shell_command", "Subprocess call sets shell=True.")
        elif terminal in {"load", "loads"} and any(
            prefix in lower_name for prefix in ("pickle.", "dill.", "marshal.", "yaml.")
        ):
            indicator = ("deserialization_candidate", f"Call to {call_name} may deserialize data unsafely.")
        elif terminal in {"md5", "sha1"}:
            indicator = ("weak_hash_candidate", f"Call to {call_name} uses a weak hash algorithm.")
        elif terminal in {"execute", "executemany"} and node.args and self._contains_string_concatenation(node.args[0]):
            indicator = ("sql_string_concatenation", "Database execution receives a string concatenation expression.")

        if indicator:
            category, evidence = indicator
            self.result.security_indicators.append(
                SecurityIndicator(category=category, line=node.lineno, evidence=evidence)
            )

    @staticmethod
    def _contains_string_concatenation(expression: ast.expr) -> bool:
        return isinstance(expression, ast.BinOp) and isinstance(expression.op, ast.Add)

    @staticmethod
    def _parameter_names(arguments: ast.arguments) -> list[str]:
        names = [argument.arg for argument in (*arguments.posonlyargs, *arguments.args)]
        if arguments.vararg:
            names.append(f"*{arguments.vararg.arg}")
        names.extend(argument.arg for argument in arguments.kwonlyargs)
        if arguments.kwarg:
            names.append(f"**{arguments.kwarg.arg}")
        return names

    @staticmethod
    def _expression_name(expression: ast.expr) -> str:
        try:
            return ast.unparse(expression)
        except (AttributeError, ValueError):
            return type(expression).__name__


class _FunctionControlSummary(ast.NodeVisitor):
    """Extract nested-loop depth and expensive-looking calls within loops."""

    _EXPENSIVE_CALLS = frozenset(
        {"open", "execute", "executemany", "query", "fetch", "get", "post", "put", "delete", "request"}
    )

    def __init__(self) -> None:
        self.loop_depth = 0
        self.maximum_loop_depth = 0
        self.expensive_calls: list[str] = []

    @classmethod
    def collect(cls, function: ast.FunctionDef | ast.AsyncFunctionDef) -> tuple[int, list[str]]:
        visitor = cls()
        for statement in function.body:
            visitor.visit(statement)
        return visitor.maximum_loop_depth, visitor.expensive_calls

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        return

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        return

    def visit_Lambda(self, node: ast.Lambda) -> None:
        return

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        return

    def visit_For(self, node: ast.For) -> None:
        self._visit_loop(node)

    def visit_AsyncFor(self, node: ast.AsyncFor) -> None:
        self._visit_loop(node)

    def visit_While(self, node: ast.While) -> None:
        self._visit_loop(node)

    def _visit_loop(self, node: ast.For | ast.AsyncFor | ast.While) -> None:
        self.loop_depth += 1
        self.maximum_loop_depth = max(self.maximum_loop_depth, self.loop_depth)
        self.generic_visit(node)
        self.loop_depth -= 1

    def visit_Call(self, node: ast.Call) -> None:
        try:
            call_name = ast.unparse(node.func)
        except (AttributeError, ValueError):
            call_name = type(node.func).__name__
        if self.loop_depth and call_name.rsplit(".", 1)[-1].casefold() in self._EXPENSIVE_CALLS:
            self.expensive_calls.append(call_name)
        self.generic_visit(node)


class _DecisionPointCounter(ast.NodeVisitor):
    """Count AST branch points within one function, excluding nested scopes."""

    def __init__(self) -> None:
        self.count = 0

    @classmethod
    def count_for(cls, function: ast.FunctionDef | ast.AsyncFunctionDef) -> int:
        visitor = cls()
        for statement in function.body:
            visitor.visit(statement)
        return visitor.count

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        # A nested function has its own independent complexity.
        return

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        return

    def visit_Lambda(self, node: ast.Lambda) -> None:
        return

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        return

    def visit_If(self, node: ast.If) -> None:
        self.count += 1
        self.generic_visit(node)

    def visit_For(self, node: ast.For) -> None:
        self.count += 1
        self.generic_visit(node)

    def visit_AsyncFor(self, node: ast.AsyncFor) -> None:
        self.count += 1
        self.generic_visit(node)

    def visit_While(self, node: ast.While) -> None:
        self.count += 1
        self.generic_visit(node)

    def visit_IfExp(self, node: ast.IfExp) -> None:
        self.count += 1
        self.generic_visit(node)

    def visit_ExceptHandler(self, node: ast.ExceptHandler) -> None:
        self.count += 1
        self.generic_visit(node)

    def visit_BoolOp(self, node: ast.BoolOp) -> None:
        self.count += max(0, len(node.values) - 1)
        self.generic_visit(node)

    def visit_comprehension(self, node: ast.comprehension) -> None:
        self.count += 1 + len(node.ifs)
        self.generic_visit(node)

    def visit_Match(self, node: ast.Match) -> None:
        self.count += sum(
            not self._is_irrefutable(case.pattern) or case.guard is not None
            for case in node.cases
        )
        self.generic_visit(node)

    @staticmethod
    def _is_irrefutable(pattern: ast.pattern) -> bool:
        return isinstance(pattern, ast.MatchAs) and pattern.pattern is None and pattern.name is None

"""A deterministic file-level dependency graph based on local Python imports."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import PurePosixPath

import networkx as nx

from app.analyzer.parser.python_parser import ParsedPythonFile


@dataclass(frozen=True)
class DependencyEdge:
    """One resolved local import relationship."""

    source: str
    target: str
    import_lines: tuple[int, ...]


@dataclass
class DependencyGraph:
    """NetworkX graph and convenient deterministic summaries."""

    graph: nx.DiGraph
    edges: list[DependencyEdge]
    fan_in: dict[str, int]
    fan_out: dict[str, int]
    cycles: list[list[str]]

    @property
    def dependency_count(self) -> int:
        """Number of unique directed file-to-file dependency edges."""
        return self.graph.number_of_edges()


def build_dependency_graph(parsed_files: list[ParsedPythonFile]) -> DependencyGraph:
    """Build a local file import graph; external imports are not graph nodes.

    Each parsed source file is a node, including files that had syntax errors.
    Imports are resolved only when their module maps to another parsed Python
    file. The graph edge points from importer to imported file.
    """
    files = {item.filename: item for item in parsed_files}
    graph = nx.DiGraph()
    module_to_file: dict[str, str] = {}

    for filename in sorted(files, key=str.casefold):
        module_name = _module_name(filename)
        graph.add_node(filename, module=module_name)
        if module_name:
            # Prefer package __init__.py if both it and a same-name .py exist.
            previous = module_to_file.get(module_name)
            if previous is None or PurePosixPath(filename).name == "__init__.py":
                module_to_file[module_name] = filename

    for source in sorted(files, key=str.casefold):
        parsed = files[source]
        for imported in parsed.imports:
            target = _resolve_import(source, imported.module, imported.names, module_to_file)
            if target is None:
                continue
            if graph.has_edge(source, target):
                lines = graph[source][target]["import_lines"]
                if imported.line not in lines:
                    lines.append(imported.line)
            else:
                graph.add_edge(source, target, import_lines=[imported.line])

    edges = [
        DependencyEdge(source=source, target=target, import_lines=tuple(data["import_lines"]))
        for source, target, data in sorted(graph.edges(data=True), key=lambda edge: (edge[0].casefold(), edge[1].casefold()))
    ]
    fan_in = {node: int(graph.in_degree(node)) for node in sorted(graph.nodes, key=str.casefold)}
    fan_out = {node: int(graph.out_degree(node)) for node in sorted(graph.nodes, key=str.casefold)}
    cycles = _find_cycles(graph)
    return DependencyGraph(graph=graph, edges=edges, fan_in=fan_in, fan_out=fan_out, cycles=cycles)


def _module_name(filename: str) -> str:
    path = PurePosixPath(filename)
    parts = list(path.parts)
    if path.suffix == ".py":
        if path.name == "__init__.py":
            parts.pop()
        else:
            parts[-1] = path.stem
    return ".".join(parts)


def _resolve_import(
    source: str,
    imported_module: str,
    imported_names: list[str],
    module_to_file: dict[str, str],
) -> str | None:
    relative_package_only = False
    if imported_module.startswith("."):
        current_module = _module_name(source)
        if PurePosixPath(source).name == "__init__.py":
            package_parts = current_module.split(".") if current_module else []
        else:
            package_parts = current_module.split(".")[:-1] if current_module else []
        level = len(imported_module) - len(imported_module.lstrip("."))
        base = package_parts[: max(0, len(package_parts) - level + 1)]
        suffix = imported_module[level:]
        target_base = ".".join([*base, *([suffix] if suffix else [])])
        relative_package_only = not suffix
    else:
        target_base = imported_module

    if not relative_package_only and target_base in module_to_file:
        return module_to_file[target_base]

    # A repository archive can contain a package root directory (for example
    # `app/`) while parsed filenames are relative to that root (`api/x.py`).
    # Resolve a prefixed absolute import only when the suffix match is unique.
    suffix_matches = [
        filename
        for module_name, filename in module_to_file.items()
        if target_base and module_name.endswith(f".{target_base}")
    ]
    if len(suffix_matches) == 1:
        return suffix_matches[0]

    # `from package import module` can name a sibling module rather than a symbol.
    for name in imported_names:
        if name == "*" or "." in name:
            continue
        candidate = f"{target_base}.{name}" if target_base else name
        if candidate in module_to_file:
            return module_to_file[candidate]
        suffix_candidates = [
            filename
            for module_name, filename in module_to_file.items()
            if candidate and module_name.endswith(f".{candidate}")
        ]
        if len(suffix_candidates) == 1:
            return suffix_candidates[0]
    if target_base in module_to_file:
        return module_to_file[target_base]
    return None


def _find_cycles(graph: nx.DiGraph) -> list[list[str]]:
    cycles = [
        sorted(component, key=str.casefold)
        for component in nx.strongly_connected_components(graph)
        if len(component) > 1 or any(graph.has_edge(node, node) for node in component)
    ]
    return sorted(cycles, key=lambda component: tuple(item.casefold() for item in component))

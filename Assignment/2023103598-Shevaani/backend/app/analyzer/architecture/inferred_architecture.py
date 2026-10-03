"""Simple directory-grouped architecture inferred from import dependencies."""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import PurePosixPath
from xml.sax.saxutils import escape

from app.analyzer.graph.dependency_graph import DependencyGraph


@dataclass(frozen=True)
class ArchitectureComponent:
    """A top-level directory grouping of analyzed source files."""

    name: str
    files: tuple[str, ...]


@dataclass(frozen=True)
class ArchitectureRelationship:
    """An aggregated directed dependency between directory components."""

    source: str
    target: str
    file_dependency_count: int


@dataclass(frozen=True)
class InferredArchitecture:
    """A candidate architecture view derived from directories and imports."""

    status: str
    components: tuple[ArchitectureComponent, ...]
    relationships: tuple[ArchitectureRelationship, ...]
    mermaid: str
    svg: str


def infer_architecture(dependencies: DependencyGraph) -> InferredArchitecture:
    """Group files by their first directory and aggregate actual import edges."""
    component_by_file = {
        filename: _component_name(filename)
        for filename in dependencies.graph.nodes
    }
    files_by_component: dict[str, list[str]] = {}
    for filename, component in component_by_file.items():
        files_by_component.setdefault(component, []).append(filename)

    components = tuple(
        ArchitectureComponent(name=name, files=tuple(sorted(files, key=str.casefold)))
        for name, files in sorted(files_by_component.items(), key=lambda item: item[0].casefold())
    )
    dependency_counts: dict[tuple[str, str], int] = {}
    for source, target in dependencies.graph.edges:
        source_component = component_by_file[source]
        target_component = component_by_file[target]
        if source_component != target_component:
            pair = (source_component, target_component)
            dependency_counts[pair] = dependency_counts.get(pair, 0) + 1

    relationships = tuple(
        ArchitectureRelationship(source, target, count)
        for (source, target), count in sorted(
            dependency_counts.items(),
            key=lambda item: (item[0][0].casefold(), item[0][1].casefold()),
        )
    )
    cycle_components = {
        component_by_file[filename]
        for cycle in dependencies.cycles
        for filename in cycle
    }
    return InferredArchitecture(
        status="INFERRED",
        components=components,
        relationships=relationships,
        mermaid=generate_mermaid(components, relationships),
        svg=generate_architecture_svg(components, relationships, cycle_components),
    )


def generate_mermaid(
    components: tuple[ArchitectureComponent, ...],
    relationships: tuple[ArchitectureRelationship, ...],
) -> str:
    """Render a Mermaid flowchart using only inferred component relationships."""
    identifiers = {component.name: f"component_{index}" for index, component in enumerate(components)}
    lines = ["flowchart TD"]
    for component in components:
        label = _safe_mermaid_label(component.name)
        lines.append(f'    {identifiers[component.name]}["{label}"]')
    for relationship in relationships:
        source_id = identifiers[relationship.source]
        target_id = identifiers[relationship.target]
        lines.append(f"    {source_id} --> {target_id}")
    return "\n".join(lines)


def _component_name(filename: str) -> str:
    parts = PurePosixPath(filename).parts
    if len(parts) == 1:
        return "Root"
    return parts[0]


def _safe_mermaid_label(value: str) -> str:
    normalized = re.sub(r"[^A-Za-z0-9 _.-]", " ", value)
    return " ".join(normalized.split()) or "Component"


def generate_architecture_svg(
    components: tuple[ArchitectureComponent, ...],
    relationships: tuple[ArchitectureRelationship, ...],
    cycle_components: set[str] | None = None,
) -> str:
    """Create a deterministic, safe, capped high-level architecture diagram.

    The overview renders at most 18 component boxes. Less-connected remaining
    components are summarized as an explicit "Other components" node.
    Cyclic components and high-weight aggregated import edges have distinct
    styling. Relationships remain data-driven; no repository names are trusted
    as SVG markup.
    """
    cycle_components = cycle_components or set()
    if len(components) > 18:
        importance = {
            component.name: sum(
                edge.file_dependency_count
                for edge in relationships
                if edge.source == component.name or edge.target == component.name
            )
            for component in components
        }
        keep = {
            item.name
            for item in sorted(components, key=lambda item: (-importance[item.name], item.name.casefold()))[:17]
        }
        shown = [item for item in components if item.name in keep]
        hidden_names = {item.name for item in components if item.name not in keep}
        hidden_files = tuple(path for item in components if item.name in hidden_names for path in item.files)
        shown.append(ArchitectureComponent("Other components", hidden_files))
        rolled: dict[tuple[str, str], int] = {}
        for edge in relationships:
            source = edge.source if edge.source in keep else "Other components"
            target = edge.target if edge.target in keep else "Other components"
            if source != target:
                rolled[(source, target)] = rolled.get((source, target), 0) + edge.file_dependency_count
        relationships = tuple(
            ArchitectureRelationship(source, target, weight)
            for (source, target), weight in sorted(rolled.items())
        )
        components = tuple(shown)

    count = len(components)
    columns = max(1, min(4, count))
    card_width, card_height = 206, 76
    gap_x, gap_y = 52, 54
    margin_x, margin_y = 28, 38
    rows = max(1, (count + columns - 1) // columns)
    width = margin_x * 2 + columns * card_width + (columns - 1) * gap_x
    height = margin_y * 2 + rows * card_height + max(0, rows - 1) * gap_y
    position = {
        item.name: (
            margin_x + (index % columns) * (card_width + gap_x),
            margin_y + (index // columns) * (card_height + gap_y),
        )
        for index, item in enumerate(components)
    }
    weight_values = [edge.file_dependency_count for edge in relationships]
    max_weight = max(weight_values, default=1)
    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="Inferred architecture diagram">',
        "<defs><marker id=\"arrow\" markerWidth=\"8\" markerHeight=\"8\" refX=\"7\" refY=\"3\" orient=\"auto\"><path d=\"M0,0 L0,6 L8,3 z\" fill=\"context-stroke\"/></marker></defs>",
        f'<rect width="{width}" height="{height}" rx="16" fill="#0a1220"/>',
        '<text x="24" y="23" fill="#8ca0b8" font-size="10" font-family="Segoe UI,Arial,sans-serif" letter-spacing="1.4">INFERRED ARCHITECTURE · LOCAL IMPORT RELATIONSHIPS</text>',
    ]
    for edge in relationships:
        if edge.source not in position or edge.target not in position:
            continue
        sx, sy = position[edge.source]
        tx, ty = position[edge.target]
        sx += card_width / 2
        sy += card_height / 2
        tx += card_width / 2
        ty += card_height / 2
        color = "#e7a86f" if edge.source in cycle_components and edge.target in cycle_components else "#6486a9"
        stroke = 1.5 + 3 * edge.file_dependency_count / max_weight
        lines.append(
            f'<path d="M {sx:.1f} {sy:.1f} C {sx:.1f} {(sy + ty) / 2:.1f}, {tx:.1f} {(sy + ty) / 2:.1f}, {tx:.1f} {ty:.1f}" fill="none" stroke="{color}" stroke-width="{stroke:.1f}" opacity="0.8" marker-end="url(#arrow)"><title>{escape(edge.source)} imports {escape(edge.target)} ({edge.file_dependency_count} file edges)</title></path>'
        )
    for component in components:
        x, y = position[component.name]
        cyclic = component.name in cycle_components
        color = "#e6a36d" if cyclic else "#58cbbf"
        fill = "#211d20" if cyclic else "#132333"
        label = escape(component.name[:32])
        lines.append(
            f'<g><rect x="{x}" y="{y}" width="{card_width}" height="{card_height}" rx="11" fill="{fill}" stroke="{color}" stroke-opacity="0.75" stroke-width="1.4"/><text x="{x + 15}" y="{y + 30}" fill="#e5edf7" font-size="13" font-weight="600" font-family="Segoe UI,Arial,sans-serif">{label}</text><text x="{x + 15}" y="{y + 52}" fill="#91a2b8" font-size="10" font-family="Segoe UI,Arial,sans-serif">{len(component.files)} source files</text></g>'
        )
    if cycle_components:
        lines.append('<text x="24" y="' + str(height - 14) + '" fill="#e6a36d" font-size="9" font-family="Segoe UI,Arial,sans-serif">Amber nodes/edges participate in an import cycle</text>')
    lines.append("</svg>")
    return "".join(lines)

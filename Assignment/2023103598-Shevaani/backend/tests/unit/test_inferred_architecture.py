from app.analyzer.architecture import infer_architecture
from app.analyzer.graph import build_dependency_graph
from app.analyzer.parser import ParsedPythonFile


def parsed(filename: str, imported_module: str | None = None) -> ParsedPythonFile:
    from app.analyzer.parser.python_parser import ImportInfo

    imports = [ImportInfo(module=imported_module, names=[imported_module], line=1)] if imported_module else []
    return ParsedPythonFile(filename=filename, loc=1, imports=imports)


def test_groups_directories_and_diagram_uses_actual_import_graph():
    files = [
        parsed("api/routes.py", "services.orders"),
        parsed("api/admin.py", "services.orders"),
        parsed("services/orders.py", "database.store"),
        parsed("database/store.py"),
        parsed("settings.py"),
    ]

    architecture = infer_architecture(build_dependency_graph(files))

    assert architecture.status == "INFERRED"
    assert [component.name for component in architecture.components] == ["api", "database", "Root", "services"]
    assert len(architecture.relationships) == 2
    relation_counts = {
        (item.source, item.target): item.file_dependency_count
        for item in architecture.relationships
    }
    assert relation_counts == {("api", "services"): 2, ("services", "database"): 1}
    assert architecture.mermaid.startswith("flowchart TD\n")
    assert architecture.mermaid.count("-->") == 2
    assert '"api"' in architecture.mermaid
    assert '"services"' in architecture.mermaid


def test_root_only_files_generate_candidate_diagram_without_relationships():
    architecture = infer_architecture(build_dependency_graph([parsed("app.py")]))

    assert architecture.status == "INFERRED"
    assert [component.name for component in architecture.components] == ["Root"]
    assert architecture.relationships == ()
    assert architecture.mermaid == 'flowchart TD\n    component_0["Root"]'

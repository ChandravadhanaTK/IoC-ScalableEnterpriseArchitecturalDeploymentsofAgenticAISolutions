from app.analyzer.graph import build_dependency_graph
from app.analyzer.parser import ParsedPythonFile, PythonAstParser


def parsed(filename: str, source: str) -> ParsedPythonFile:
    """Parse one in-memory source file for a graph test."""
    import ast

    from app.analyzer.parser.python_parser import _StructureCollector

    result = ParsedPythonFile(filename=filename, loc=len(source.splitlines()))
    _StructureCollector(result).visit(ast.parse(source, filename=filename))
    return result


def test_builds_local_import_edges_and_fan_in_fan_out():
    files = [
        parsed("api/routes.py", "from services.orders import create_order\nimport json\n"),
        parsed("services/orders.py", "from database.store import save\n"),
        parsed("database/store.py", "VALUE = 1\n"),
        parsed("standalone.py", "import os\n"),
    ]

    result = build_dependency_graph(files)

    assert result.graph.is_directed()
    assert result.dependency_count == 2
    assert {(edge.source, edge.target) for edge in result.edges} == {
        ("api/routes.py", "services/orders.py"),
        ("services/orders.py", "database/store.py"),
    }
    assert result.fan_out == {
        "api/routes.py": 1,
        "database/store.py": 0,
        "services/orders.py": 1,
        "standalone.py": 0,
    }
    assert result.fan_in["database/store.py"] == 1
    assert result.cycles == []


def test_resolves_relative_imports_and_package_init_modules():
    files = [
        parsed("pkg/__init__.py", ""),
        parsed("pkg/api.py", "from .services import run\n"),
        parsed("pkg/services/__init__.py", ""),
        parsed("pkg/services/worker.py", "from . import helpers\n"),
        parsed("pkg/services/helpers.py", "VALUE = 1\n"),
    ]

    result = build_dependency_graph(files)
    edges = {(edge.source, edge.target) for edge in result.edges}

    assert ("pkg/api.py", "pkg/services/__init__.py") in edges
    assert ("pkg/services/worker.py", "pkg/services/helpers.py") in edges


def test_detects_import_cycle_and_self_import():
    files = [
        parsed("a.py", "import b\n"),
        parsed("b.py", "import a\n"),
        parsed("self_import.py", "import self_import\n"),
    ]

    result = build_dependency_graph(files)

    assert result.cycles == [["a.py", "b.py"], ["self_import.py"]]


def test_graph_contains_syntax_error_file_but_no_unparsed_edges(tmp_path):
    broken = tmp_path / "bad.py"
    broken.write_text("import good\ndef invalid(:\n", encoding="utf-8")
    good = tmp_path / "good.py"
    good.write_text("VALUE = 1\n", encoding="utf-8")
    parser = PythonAstParser()
    files = [parser.parse_file(broken, tmp_path), parser.parse_file(good, tmp_path)]

    result = build_dependency_graph(files)

    assert set(result.graph.nodes) == {"bad.py", "good.py"}
    assert result.dependency_count == 0

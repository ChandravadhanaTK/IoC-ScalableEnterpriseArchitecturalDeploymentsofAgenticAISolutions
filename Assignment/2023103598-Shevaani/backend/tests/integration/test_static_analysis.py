from pathlib import Path

from app.analyzer.architecture import infer_architecture
from app.analyzer.detectors import SmellThresholds, detect_smells
from app.analyzer.graph import build_dependency_graph
from app.analyzer.metrics import calculate_metrics
from app.analyzer.parser import PythonAstParser


def test_python_project_static_pipeline_from_parse_to_architecture(tmp_path: Path):
    root = tmp_path / "demo"
    (root / "api").mkdir(parents=True)
    (root / "services").mkdir()
    (root / "database").mkdir()
    (root / "api" / "routes.py").write_text(
        """import services.orders
import services.inventory

class RouteController:
    def submit(self, customer, order, options):
        if customer:
            validate(customer)
            save(order)
            audit(options)

    def health(self):
        return True
""",
        encoding="utf-8",
    )
    (root / "services" / "orders.py").write_text(
        "import api.routes\nimport database.store\n",
        encoding="utf-8",
    )
    (root / "services" / "inventory.py").write_text("VALUE = 1\n", encoding="utf-8")
    (root / "database" / "store.py").write_text("def save(value): return value\n", encoding="utf-8")

    parsed = PythonAstParser().parse_directory(root)
    metrics = calculate_metrics(parsed)
    graph = build_dependency_graph(parsed)
    findings = detect_smells(
        parsed,
        metrics,
        graph,
        SmellThresholds(
            long_method_lines=3,
            large_class_methods=1,
            long_parameter_count=2,
            high_fan_out=1,
        ),
    )
    architecture = infer_architecture(graph)

    assert metrics.files == 4
    assert metrics.classes == 1
    assert metrics.methods == 2
    assert graph.dependency_count == 4
    assert {finding.type for finding in findings} == {
        "Long Method",
        "Large Class",
        "Long Parameter List",
        "Excessive Coupling",
        "Circular Dependency",
    }
    assert architecture.status == "INFERRED"
    assert {(item.source, item.target) for item in architecture.relationships} == {
        ("api", "services"),
        ("services", "api"),
        ("services", "database"),
    }
    assert architecture.mermaid.count("-->") == 3

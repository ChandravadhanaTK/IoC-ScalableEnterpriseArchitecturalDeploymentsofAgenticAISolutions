from pathlib import Path

from app.analyzer.detectors import analyze_performance, analyze_security, analyze_solid
from app.analyzer.graph import build_dependency_graph
from app.analyzer.metrics import calculate_metrics
from app.analyzer.parser import PythonAstParser


def test_security_detector_reports_potential_patterns(tmp_path: Path):
    source = tmp_path / "unsafe.py"
    source.write_text(
        """API_KEY = 'example-not-a-real-key'
import subprocess
import pickle

def unsafe(value):
    eval(value)
    subprocess.run(value, shell=True)
    pickle.loads(value)
""",
        encoding="utf-8",
    )

    parsed = PythonAstParser().parse_file(source)
    findings = analyze_security([parsed])

    assert {finding.evidence["pattern"] for finding in findings} == {
        "hard_coded_credential_candidate",
        "dynamic_code_execution",
        "shell_command",
        "deserialization_candidate",
    }
    assert all(finding.requires_validation for finding in findings)
    assert all(finding.status == "potential" for finding in findings)


def test_performance_detector_reports_static_loop_and_complexity_signals(tmp_path: Path):
    source = tmp_path / "hot.py"
    source.write_text(
        """def work(rows):
    for row in rows:
        for item in row:
            database.execute(item)
    if rows and len(rows) > 1:
        return rows
    return []
""",
        encoding="utf-8",
    )

    parsed = [PythonAstParser().parse_file(source)]
    metrics = calculate_metrics(parsed)
    findings = analyze_performance(parsed, metrics, high_complexity=3)

    assert {finding.evidence.get("maximum_loop_depth", 0) for finding in findings} >= {2}
    assert any(finding.evidence.get("calls") == ["database.execute"] for finding in findings)
    assert any(finding.evidence.get("complexity", 0) >= 3 for finding in findings)
    assert all(finding.requires_validation for finding in findings)


def test_solid_detector_labels_name_and_dependency_evidence_as_candidates(tmp_path: Path):
    root = tmp_path / "repo"
    (root / "services").mkdir(parents=True)
    (root / "database").mkdir()
    (root / "services" / "manager.py").write_text(
        """from database.store import save

class Manager(Base):
    def validate(self, value): return value
    def save(self, value): return save(value)
    def render(self, value): return str(value)
    def run(self, value):
        if isinstance(value, str): return self.render(value)
        if isinstance(value, int): return value
        return None
""",
        encoding="utf-8",
    )
    (root / "database" / "store.py").write_text("class Base:\n    def run(self): pass\n", encoding="utf-8")

    parsed = PythonAstParser().parse_directory(root)
    dependencies = build_dependency_graph(parsed)
    findings = analyze_solid(parsed, dependencies)

    principles = {finding.type for finding in findings}
    assert "Potential SRP concern" in principles
    assert "Potential OCP concern" in principles
    assert "Potential DIP concern" in principles
    assert all(finding.status == "candidate" for finding in findings)
    assert all(finding.requires_validation for finding in findings)


def test_solid_detector_includes_potential_isp_and_lsp_candidates(tmp_path: Path):
    source = tmp_path / "inheritance.py"
    methods = "\n".join(f"    def operation_{index}(self): return None" for index in range(3))
    source.write_text(
        f"class Base:\n{methods}\n\nclass Child(Base):\n    def operation_0(self): return True\n",
        encoding="utf-8",
    )
    parsed = [PythonAstParser().parse_file(source)]
    findings = analyze_solid(parsed, build_dependency_graph(parsed), wide_interface_methods=2)

    assert any("Potential ISP concern" == finding.type for finding in findings)
    assert any("Potential LSP concern" == finding.type for finding in findings)
    assert all(finding.requires_validation for finding in findings)

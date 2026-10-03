from app.analyzer.detectors.basic_smells import SmellThresholds, detect_smells
from app.analyzer.graph import build_dependency_graph
from app.analyzer.metrics import calculate_metrics
from app.analyzer.parser import ParsedPythonFile, PythonAstParser


def parse(filename: str, source: str) -> ParsedPythonFile:
    import ast

    from app.analyzer.parser.python_parser import _StructureCollector

    result = ParsedPythonFile(filename=filename, loc=len(source.splitlines()))
    _StructureCollector(result).visit(ast.parse(source, filename=filename))
    return result


def test_detects_exactly_the_five_initial_smell_types():
    files = [
        parse(
            "src/hub.py",
            """import src.left
import src.right

class Large:
    def long(self, one, two, three):
        if one:
            first()
            second()
            third()

    def another(self):
        return None
""",
        ),
        parse("src/left.py", "import src.hub\n"),
        parse("src/right.py", "VALUE = 1\n"),
    ]
    metrics = calculate_metrics(files)
    graph = build_dependency_graph(files)
    findings = detect_smells(
        files,
        metrics,
        graph,
        SmellThresholds(
            long_method_lines=3,
            large_class_methods=1,
            long_parameter_count=2,
            high_fan_out=1,
        ),
    )

    assert {finding.type for finding in findings} == {
        "Long Method",
        "Large Class",
        "Long Parameter List",
        "Excessive Coupling",
        "Circular Dependency",
    }
    assert len(findings) == 5

    long_method = next(finding for finding in findings if finding.type == "Long Method")
    assert long_method.file == "src/hub.py"
    assert long_method.line == 5
    assert long_method.evidence["lines"] == 5
    assert long_method.evidence["complexity"] == 2

    large_class = next(finding for finding in findings if finding.type == "Large Class")
    assert large_class.evidence["method_count"] == 2

    long_parameters = next(finding for finding in findings if finding.type == "Long Parameter List")
    assert long_parameters.evidence["parameter_count"] == 3
    assert long_parameters.evidence["parameters"] == ["one", "two", "three"]

    coupling = next(finding for finding in findings if finding.type == "Excessive Coupling")
    assert coupling.evidence["fan_out"] == 2

    cycle = next(finding for finding in findings if finding.type == "Circular Dependency")
    assert cycle.evidence["files"] == ["src/hub.py", "src/left.py"]


def test_default_thresholds_do_not_report_small_clean_function():
    files = [parse("clean.py", "def add(a, b):\n    return a + b\n")]
    findings = detect_smells(files, calculate_metrics(files), build_dependency_graph(files))

    assert findings == []


def test_can_create_smell_thresholds_from_application_settings():
    from app.core.config import Settings
    from app.analyzer.detectors.basic_smells import thresholds_from_settings

    settings = Settings(
        _env_file=None,
        long_method_lines=12,
        large_class_methods=7,
        long_parameter_count=4,
        high_fan_out=6,
        god_class_methods=22,
    )

    assert thresholds_from_settings(settings) == SmellThresholds(12, 7, 4, 6, 22, 500, 10, 15, 3)


def test_detects_potential_god_class_only_when_multiple_signals_are_met():
    many_methods = "\n".join(
        f"    def operation_{index}(self):\n        return self.store_{index}.save(index)"
        for index in range(4)
    )
    god_source = "class God:\n" + "\n".join(
        f"    field_{index} = {index}" for index in range(4)
    ) + "\n" + many_methods + "\n"
    normal_source = "class Normal:\n    def run(self):\n        return True\n"
    files = [parse("god.py", god_source), parse("normal.py", normal_source)]
    thresholds = SmellThresholds(
        large_class_methods=10,
        god_class_methods=3,
        god_class_loc=8,
        god_class_fan_out=3,
        god_class_attributes=3,
        god_class_min_signals=3,
    )

    findings = detect_smells(files, calculate_metrics(files), build_dependency_graph(files), thresholds)
    candidates = [finding for finding in findings if finding.type == "Potential God Class"]

    assert len(candidates) == 1
    assert candidates[0].file == "god.py"
    assert candidates[0].category == "heuristic/potential"
    assert candidates[0].requires_validation is True
    assert candidates[0].evidence["attribute_count"] == 4
    assert candidates[0].evidence["collaborators"] == ["store_0", "store_1", "store_2", "store_3"]
    assert len(candidates[0].evidence["signals_met"]) >= 3


def test_large_class_and_potential_god_class_are_distinct_findings():
    source = "class Broad:\n" + "\n".join(
        f"    def method_{index}(self):\n        return {index}" for index in range(3)
    ) + "\n"
    files = [parse("broad.py", source)]
    thresholds = SmellThresholds(large_class_methods=2, god_class_methods=50, god_class_loc=500, god_class_attributes=50, god_class_fan_out=10)

    findings = detect_smells(files, calculate_metrics(files), build_dependency_graph(files), thresholds)

    assert [finding.type for finding in findings] == ["Large Class"]

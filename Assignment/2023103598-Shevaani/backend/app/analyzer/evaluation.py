"""Controlled, labeled fixture evaluation for production smell detectors."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import tempfile
from app.analyzer.detectors.basic_smells import SmellThresholds, detect_smells
from app.analyzer.graph import build_dependency_graph
from app.analyzer.metrics import calculate_metrics as calculate_project_metrics
from app.analyzer.parser import PythonAstParser


@dataclass(frozen=True)
class ConfusionCounts:
    tp: int
    tn: int
    fp: int
    fn: int


@dataclass(frozen=True)
class DetectorMetrics:
    counts: ConfusionCounts
    accuracy: float | None
    precision: float | None
    recall: float | None
    f1: float | None


_FIXTURES: dict[str, tuple[bool, dict[str, str], SmellThresholds, tuple[str, ...]]] = {
    "Long Method": (
        True,
        {"target.py": "def work():\n" + "    value = 1\n" * 6},
        SmellThresholds(long_method_lines=5, large_class_methods=100, long_parameter_count=100, high_fan_out=100),
        ("Long Method",),
    ),
    "God Class": (
        True,
        {"target.py": "class Hub:\n" + "    field_1 = 1\n    field_2 = 2\n    field_3 = 3\n" + "\n".join(f"    def op_{i}(self): return self.store_{i}.save()" for i in range(1, 4))},
        SmellThresholds(long_method_lines=100, large_class_methods=2, long_parameter_count=100, high_fan_out=100, god_class_methods=3, god_class_loc=100, god_class_attributes=3, god_class_fan_out=3),
        ("Large Class", "Potential God Class"),
    ),
    "Cyclic Dependency": (
        True,
        {"a.py": "import b\n", "b.py": "import a\n"},
        SmellThresholds(long_method_lines=100, large_class_methods=100, long_parameter_count=100, high_fan_out=100),
        ("Circular Dependency",),
    ),
    "Long Parameter List": (
        True,
        {"target.py": "def work(a, b, c, d):\n    return a\n"},
        SmellThresholds(long_method_lines=100, large_class_methods=100, long_parameter_count=3, high_fan_out=100),
        ("Long Parameter List",),
    ),
    "Excessive Coupling": (
        True,
        {"hub.py": "import a\nimport b\n", "a.py": "VALUE = 1\n", "b.py": "VALUE = 2\n"},
        SmellThresholds(long_method_lines=100, large_class_methods=100, long_parameter_count=100, high_fan_out=1),
        ("Excessive Coupling",),
    ),
}

_NEGATIVE_FIXTURES: dict[str, tuple[dict[str, str], SmellThresholds]] = {
    "Long Method": ({"target.py": "def work():\n    return 1\n"}, SmellThresholds()),
    "God Class": ({"target.py": "class Hub:\n    def work(self): return 1\n"}, SmellThresholds()),
    "Cyclic Dependency": ({"a.py": "import b\n", "b.py": "VALUE = 1\n"}, SmellThresholds()),
    "Long Parameter List": ({"target.py": "def work(a, b):\n    return a\n"}, SmellThresholds()),
    "Excessive Coupling": ({"hub.py": "import a\n", "a.py": "VALUE = 1\n"}, SmellThresholds()),
}

_DETECTOR_NAMES = tuple(_FIXTURES)


def safe_divide(numerator: float, denominator: float) -> float | None:
    return numerator / denominator if denominator else None


def calculate_metrics(counts: ConfusionCounts) -> DetectorMetrics:
    total = counts.tp + counts.tn + counts.fp + counts.fn
    precision = safe_divide(counts.tp, counts.tp + counts.fp)
    recall = safe_divide(counts.tp, counts.tp + counts.fn)
    f1 = safe_divide(2 * precision * recall, precision + recall) if precision is not None and recall is not None else None
    return DetectorMetrics(
        counts=counts,
        accuracy=safe_divide(counts.tp + counts.tn, total),
        precision=precision,
        recall=recall,
        f1=f1,
    )


def compare_predictions(ground_truth: list[bool], predictions: list[bool]) -> ConfusionCounts:
    if len(ground_truth) != len(predictions):
        raise ValueError("Ground truth and predictions must have equal length.")
    tp = tn = fp = fn = 0
    for expected, predicted in zip(ground_truth, predictions):
        if expected and predicted:
            tp += 1
        elif not expected and not predicted:
            tn += 1
        elif predicted:
            fp += 1
        else:
            fn += 1
    return ConfusionCounts(tp=tp, tn=tn, fp=fp, fn=fn)


def _predict_fixture(root: Path, sources: dict[str, str], thresholds: SmellThresholds, detector: str) -> bool:
    for filename, source in sources.items():
        path = root / filename
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(source, encoding="utf-8")
    parsed = PythonAstParser().parse_directory(root)
    graph = build_dependency_graph(parsed)
    findings = detect_smells(parsed, calculate_project_metrics(parsed), graph, thresholds)
    wanted = set(_FIXTURES[detector][3])
    return any(finding.type in wanted for finding in findings)


def evaluate_detectors() -> dict[str, DetectorMetrics]:
    """Run real production detectors against paired, explicitly labeled fixtures."""
    scores: dict[str, DetectorMetrics] = {}
    with tempfile.TemporaryDirectory(prefix="aar-detector-eval-") as temporary:
        base = Path(temporary)
        for detector in _DETECTOR_NAMES:
            expected, positive_sources, positive_thresholds, _ = _FIXTURES[detector]
            negative_sources, negative_thresholds = _NEGATIVE_FIXTURES[detector]
            positive = _predict_fixture(base / detector.replace(" ", "_") / "positive", positive_sources, positive_thresholds, detector)
            negative = _predict_fixture(base / detector.replace(" ", "_") / "negative", negative_sources, negative_thresholds, detector)
            scores[detector] = calculate_metrics(compare_predictions([expected, False], [positive, negative]))
    return scores


def _average(values: list[float | None]) -> float | None:
    available = [value for value in values if value is not None]
    return safe_divide(sum(available), len(available)) if available else None


def macro_average(scores: dict[str, DetectorMetrics]) -> DetectorMetrics:
    return DetectorMetrics(
        counts=ConfusionCounts(
            tp=sum(item.counts.tp for item in scores.values()),
            tn=sum(item.counts.tn for item in scores.values()),
            fp=sum(item.counts.fp for item in scores.values()),
            fn=sum(item.counts.fn for item in scores.values()),
        ),
        accuracy=_average([item.accuracy for item in scores.values()]),
        precision=_average([item.precision for item in scores.values()]),
        recall=_average([item.recall for item in scores.values()]),
        f1=_average([item.f1 for item in scores.values()]),
    )


def _format(value: float | None) -> str:
    return f"{value:.2f}" if value is not None else "N/A"


def print_evaluation() -> None:
    scores = evaluate_detectors()
    macro = macro_average(scores)
    print("\n" + "=" * 68, "AI ARCHITECTURE REVIEWER — DETECTOR EVALUATION", "=" * 68, sep="\n")
    print(f"{'Detector':<27}{'Accuracy':>10}{'Precision':>12}{'Recall':>10}{'F1':>8}")
    print("-" * 68)
    for name, item in scores.items():
        print(f"{name:<27}{_format(item.accuracy):>10}{_format(item.precision):>12}{_format(item.recall):>10}{_format(item.f1):>8}")
    print("-" * 68)
    print(f"{'Macro Average':<27}{_format(macro.accuracy):>10}{_format(macro.precision):>12}{_format(macro.recall):>10}{_format(macro.f1):>8}")
    print("=" * 68)
    print("Evaluation performed on controlled ground-truth fixtures;\nthese values are not claims of accuracy on arbitrary real-world repositories.", flush=True)

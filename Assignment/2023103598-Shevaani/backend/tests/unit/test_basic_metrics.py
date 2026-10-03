from pathlib import Path

from app.analyzer.metrics import calculate_metrics
from app.analyzer.parser import PythonAstParser


def test_aggregates_project_and_per_function_metrics(tmp_path: Path):
    root = tmp_path / "repo"
    root.mkdir()
    (root / "first.py").write_text(
        """import os, sys

class Worker:
    def run(self, item, mode='default'):
        if item and mode:
            for part in item:
                process(part)
        return item

def plain(a, b, c):
    return a + b + c
""",
        encoding="utf-8",
    )
    (root / "second.py").write_text(
        """from pathlib import Path

def other():
    return Path('.')
""",
        encoding="utf-8",
    )

    parsed = PythonAstParser().parse_directory(root)
    metrics = calculate_metrics(parsed)

    assert metrics.files == 2
    assert metrics.lines_of_code == sum(item.loc for item in parsed)
    assert metrics.classes == 1
    assert metrics.functions == 2
    assert metrics.methods == 1
    assert metrics.imports == 3
    assert [item.filename for item in metrics.file_metrics] == ["first.py", "second.py"]
    assert metrics.file_metrics[0].methods == 1
    assert metrics.file_metrics[0].functions == 1
    assert metrics.file_metrics[0].imports == 2

    by_name = {item.name: item for item in metrics.function_metrics}
    assert by_name["Worker.run"].parameter_count == 2
    assert by_name["Worker.run"].complexity == 4
    assert by_name["plain"].parameter_count == 3
    assert by_name["plain"].complexity == 1
    assert by_name["other"].complexity == 1


def test_complexity_counts_decisions_but_excludes_nested_function_body(tmp_path: Path):
    path = tmp_path / "complex.py"
    path.write_text(
        """def outer(values):
    if values:
        values = [value for value in values if value > 0]
    def inner(value):
        if value:
            return True
        return False
    return values
""",
        encoding="utf-8",
    )

    metrics = calculate_metrics([PythonAstParser().parse_file(path)])
    by_name = {item.name: item for item in metrics.function_metrics}

    # Base 1 + if + comprehension generator + comprehension filter.
    assert by_name["outer"].complexity == 4
    # The nested function is separately measured and doesn't inflate outer.
    assert by_name["outer.inner"].complexity == 2


def test_malformed_files_still_contribute_file_and_loc_counts(tmp_path: Path):
    good = tmp_path / "good.py"
    bad = tmp_path / "bad.py"
    good.write_text("def okay():\n    return 1\n", encoding="utf-8")
    bad.write_text("def broken(:\n    pass\n", encoding="utf-8")

    parsed = [PythonAstParser().parse_file(good), PythonAstParser().parse_file(bad)]
    metrics = calculate_metrics(parsed)

    assert metrics.files == 2
    assert metrics.lines_of_code == 4
    assert metrics.functions == 1
    assert len(metrics.function_metrics) == 1


def test_empty_project_returns_zero_counts():
    metrics = calculate_metrics([])

    assert metrics.files == 0
    assert metrics.lines_of_code == 0
    assert metrics.classes == 0
    assert metrics.functions == 0
    assert metrics.methods == 0
    assert metrics.imports == 0
    assert metrics.function_metrics == []

from pathlib import Path

from app.analyzer.parser import PythonAstParser


def test_extracts_file_structure_and_source_locations(tmp_path: Path):
    root = tmp_path / "repository"
    root.mkdir()
    source = """# Header comment
import os
import pathlib as paths
from .models import Base, Record as DataRecord

class Child(Base, other.Parent):
    def process(self, item, mode='safe', *, enabled=False):
        validate(item)
        self.repository.save(item)

    async def refresh(cls, value):
        await load(value)

def calculate(left, right=0):
    return combine(left, right)
"""
    source_path = root / "package" / "module.py"
    source_path.parent.mkdir()
    source_path.write_text(source, encoding="utf-8")

    parsed = PythonAstParser().parse_file(source_path, root)

    assert parsed.filename == "package/module.py"
    assert parsed.loc == 11
    assert parsed.parse_error is None
    assert [(item.module, item.names) for item in parsed.imports] == [
        ("os", ["os"]),
        ("pathlib", ["pathlib"]),
        (".models", ["Base", "Record"]),
    ]
    assert [(item.name, item.base_classes) for item in parsed.classes] == [
        ("Child", ["Base", "other.Parent"])
    ]

    child = parsed.classes[0]
    assert [method.name for method in child.methods] == ["process", "refresh"]
    process, refresh = child.methods
    assert process.line_start == 7
    assert process.line_end == 9
    assert process.parameter_count == 3
    assert process.calls == ["validate", "self.repository.save"]
    assert refresh.is_async is True
    assert refresh.parameter_count == 1
    assert refresh.calls == ["load"]

    assert [(function.name, function.qualified_name) for function in parsed.functions] == [
        ("calculate", "calculate")
    ]
    assert parsed.functions[0].parameters == ["left", "right"]
    assert parsed.functions[0].calls == ["combine"]
    assert parsed.calls == ["validate", "self.repository.save", "load", "combine"]


def test_directory_parser_continues_after_syntax_error_and_skips_generated_paths(tmp_path: Path):
    root = tmp_path / "repo"
    (root / "src").mkdir(parents=True)
    (root / "src" / "a_bad.py").write_text("def broken(:\n    pass\n", encoding="utf-8")
    (root / "src" / "b_good.py").write_text("def okay():\n    return 1\n", encoding="utf-8")
    (root / ".venv" / "lib").mkdir(parents=True)
    (root / ".venv" / "lib" / "ignored.py").write_text("raise RuntimeError()\n", encoding="utf-8")

    parsed_files = PythonAstParser().parse_directory(root)

    assert [item.filename for item in parsed_files] == ["src/a_bad.py", "src/b_good.py"]
    assert parsed_files[0].parse_error is not None
    assert "SyntaxError at line 1" in parsed_files[0].parse_error
    assert parsed_files[0].classes == []
    assert parsed_files[1].parse_error is None
    assert [function.name for function in parsed_files[1].functions] == ["okay"]


def test_loc_excludes_blank_and_comment_only_lines(tmp_path: Path):
    source_path = tmp_path / "loc.py"
    source_path.write_text("# comment\n\nvalue = 1  # inline comment\nprint(value)\n", encoding="utf-8")

    parsed = PythonAstParser().parse_file(source_path)

    assert parsed.loc == 2

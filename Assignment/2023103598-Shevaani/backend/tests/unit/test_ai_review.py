from app.analyzer.llm.review_service import (
    FalsePositiveCandidate,
    GeminiReview,
    MajorConcern,
    RefactoringRecommendation,
    build_review_evidence,
    generate_ai_review,
)
from app.core.config import Settings


def make_analysis():
    return {
        "analysis_id": "ANL-test",
        "repository": {
            "name": "sample",
            "source": "https://github.com/pallets/flask",
            "python_files": 1,
        },
        "metrics": {
            "files": 1,
            "lines_of_code": 20,
            "classes": 1,
            "functions": 2,
            "methods": 1,
            "imports": 3,
            "function_metrics": [],
            "file_metrics": [],
        },
        "dependency_graph": {"dependency_count": 1, "cycles": []},
        "architecture": {
            "status": "INFERRED",
            "components": [{"name": "services"}],
            "relationships": [],
        },
        "findings": [
            {
                "id": "finding-1",
                "type": "Long Method",
                "severity": "high",
                "status": "detected",
                "file": "service.py",
                "line": 4,
                "message": "Function exceeds line threshold.",
                "evidence": {"lines": 80},
                "source_snippet": {"text": "def work():\\n    pass"},
            }
        ],
    }


def test_ai_is_reported_unconfigured_without_network_request():
    analysis = make_analysis()
    result = generate_ai_review(analysis, Settings(_env_file=None))

    assert result["status"] == "not_configured"
    assert result["findings"] == []
    assert analysis["findings"][0]["type"] == "Long Method"


def test_evidence_builder_sends_compact_project_and_selected_finding_data():
    evidence = build_review_evidence(make_analysis())

    assert evidence["repository"]["name"] == "sample"
    assert evidence["repository"]["python_files"] == 1
    assert evidence["repository"]["repository_url"] == "https://github.com/pallets/flask"
    assert evidence["metrics"]["lines_of_code"] == 20
    assert evidence["findings"][0]["finding_id"] == "finding-1"
    assert "function_metrics" not in evidence["metrics"]
    assert evidence["findings"][0]["source_snippet"]


def test_ai_review_keeps_only_supported_finding_ids(monkeypatch):
    from app.analyzer.llm import review_service

    review = GeminiReview(
        summary="A small service project.",
        architecture_assessment="One inferred service component.",
        major_concerns=[
            MajorConcern(
                title="Long operation",
                finding_id="finding-1",
                finding_type="Hallucinated type is ignored",
                severity="low",
                confidence="high",
                evidence="The function combines several operations.",
                impact="Maintenance may be harder.",
                recommendation="Split responsibilities into smaller functions.",
            ),
            MajorConcern(
                title="Invented claim",
                finding_id="invented-id",
                finding_type="invented",
                severity="high",
                confidence="high",
                evidence="Unsupported claim.",
                impact="Unknown.",
                recommendation="Unknown.",
            ),
        ],
        refactoring_recommendations=[
            RefactoringRecommendation(
                title="Add tests",
                description="Add focused unit tests.",
                priority="medium",
                evidence="No test evidence was supplied.",
            )
        ],
        false_positive_candidates=[FalsePositiveCandidate(finding_id="invented-id", reason="not supplied")],
    )

    def fake_review(self, evidence):
        return review, {"input": 120, "output": 60}

    monkeypatch.setattr(review_service.GeminiReviewProvider, "review", fake_review)
    result = generate_ai_review(
        make_analysis(),
        Settings(_env_file=None, gemini_api_key="test-key", gemini_model="test-model"),
    )

    assert result["status"] == "completed"
    assert [item["finding_id"] for item in result["findings"]] == ["finding-1"]
    assert result["overall_recommendations"] == ["Add focused unit tests."]
    concern = result["major_concerns"][0]
    assert concern["finding_type"] == "Long Method"
    assert concern["severity"] == "high"
    assert concern["file"] == "service.py"
    assert result["input_tokens"] == 120


def test_ai_review_handles_malformed_gemini_response(monkeypatch):
    from app.analyzer.llm import review_service

    class MalformedProvider:
        def __init__(self, *_args):
            pass

        def review(self, _evidence):
            raise ValueError("malformed provider response")

    monkeypatch.setattr(review_service, "GeminiReviewProvider", MalformedProvider)
    result = generate_ai_review(
        make_analysis(),
        Settings(_env_file=None, gemini_api_key="test-key"),
    )

    assert result["status"] == "failed"
    assert "malformed" in result["message"].lower()
    assert result["findings"] == []


def test_ai_provider_error_returns_unavailable_without_modifying_analysis(monkeypatch):
    from app.analyzer.llm import review_service

    def fail_provider(self, evidence):
        raise RuntimeError("provider unavailable GEMINI_SECRET")

    analysis = make_analysis()
    monkeypatch.setattr(review_service.GeminiReviewProvider, "review", fail_provider)
    result = generate_ai_review(
        analysis,
        Settings(_env_file=None, gemini_api_key="test-key"),
    )

    assert result["status"] == "failed"
    assert "GEMINI_SECRET" not in result["message"]
    assert analysis["findings"][0]["id"] == "finding-1"


def test_gemini_auth_and_rate_limit_errors_are_distinguished(monkeypatch):
    from app.analyzer.llm import review_service

    class FakeGeminiError(Exception):
        def __init__(self, code):
            super().__init__("response contained GEMINI_SECRET")
            self.code = code

    class FailingProvider:
        code = 401

        def __init__(self, *_args):
            pass

        def review(self, _evidence):
            raise FakeGeminiError(self.code)

    monkeypatch.setattr(review_service, "GeminiReviewProvider", FailingProvider)
    settings = Settings(_env_file=None, gemini_api_key="test-key")

    assert generate_ai_review(make_analysis(), settings)["status"] == "authentication_error"
    FailingProvider.code = 429
    rate_limited = generate_ai_review(make_analysis(), settings)
    assert rate_limited["status"] == "rate_limited"
    assert "GEMINI_SECRET" not in rate_limited["message"]

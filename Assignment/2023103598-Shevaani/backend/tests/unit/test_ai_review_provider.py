from app.analyzer.llm.review_service import GeminiReviewProvider


def test_gemini_provider_uses_google_sdk_and_schema(monkeypatch):
    from google import genai

    captured = {}

    class FakeModels:
        def generate_content(self, **kwargs):
            captured.update(kwargs)
            return type(
                "Response",
                (),
                {
                    "text": '{"summary":"ok","architecture_assessment":"inferred","major_concerns":[],"refactoring_recommendations":[],"false_positive_candidates":[]}',
                    "usage_metadata": type("Usage", (), {"prompt_token_count": 12, "candidates_token_count": 8})(),
                },
            )()

    class FakeClient:
        def __init__(self, *, api_key):
            captured["api_key"] = api_key
            self.models = FakeModels()

    monkeypatch.setattr(genai, "Client", FakeClient)
    provider = GeminiReviewProvider("secret-key-test", "gemini-test")
    review, tokens = provider.review({
        "repository": {"repository_url": "https://github.com/pallets/flask"},
        "metrics": {"files": 1},
    })

    assert captured["api_key"] == "secret-key-test"
    assert captured["model"] == "gemini-test"
    assert "metrics" in captured["contents"]
    assert "https://github.com/pallets/flask" in captured["contents"]
    assert captured["config"].tools
    assert captured["config"].response_mime_type == "application/json"
    assert review.summary == "ok"
    assert tokens == {"input": 12, "output": 8}


def test_gemini_provider_rejects_malformed_structured_response(monkeypatch):
    from google import genai

    class FakeClient:
        def __init__(self, *, api_key):
            self.models = type(
                "Models",
                (),
                {"generate_content": lambda *_args, **_kwargs: type("Response", (), {"text": "not json", "usage_metadata": None})()},
            )()

    monkeypatch.setattr(genai, "Client", FakeClient)
    provider = GeminiReviewProvider("secret-key-test", "gemini-test")

    try:
        provider.review({})
    except ValueError as error:
        assert "malformed" in str(error)
        assert "secret-key-test" not in str(error)
    else:
        raise AssertionError("Malformed Gemini JSON should be rejected")


def test_gemini_provider_uses_sdk_parsed_response_when_text_is_empty(monkeypatch):
    from google import genai

    class FakeClient:
        def __init__(self, *, api_key):
            self.models = type(
                "Models",
                (),
                {
                    "generate_content": lambda *_args, **_kwargs: type(
                        "Response",
                        (),
                        {
                            "text": None,
                            "parsed": {
                                "summary": "Readable review",
                                "architecture_assessment": "Small project",
                                "major_concerns": [],
                                "refactoring_recommendations": [],
                                "false_positive_candidates": [],
                            },
                            "usage_metadata": None,
                        },
                    )(),
                },
            )()

    monkeypatch.setattr(genai, "Client", FakeClient)
    review, _ = GeminiReviewProvider("secret-key-test", "gemini-test").review({})

    assert review.summary == "Readable review"


def test_gemini_provider_prefers_complete_json_over_incomplete_sdk_parsed_value(monkeypatch):
    from google import genai

    raw = '{"summary":"Complete text result","architecture_assessment":"Repository summary","major_concerns":[],"refactoring_recommendations":[],"false_positive_candidates":[]}'

    class FakeClient:
        def __init__(self, *, api_key):
            self.models = type(
                "Models",
                (),
                {"generate_content": lambda *_args, **_kwargs: type(
                    "Response", (), {"text": raw, "parsed": {"summary": "Incomplete"}, "usage_metadata": None}
                )()},
            )()

    monkeypatch.setattr(genai, "Client", FakeClient)
    review, _ = GeminiReviewProvider("secret-key-test", "gemini-test").review({})

    assert review.summary == "Complete text result"

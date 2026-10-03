from __future__ import annotations

import io
import zipfile

from fastapi.testclient import TestClient

from app.api.ingestion import get_ingestion_service
from app.core.config import Settings
from app.main import app
from app.services.repository_ingestion import RepositoryIngestionService


def zip_bytes(entries: dict[str, bytes]) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        for name, data in entries.items():
            archive.writestr(name, data)
    return buffer.getvalue()


def test_zip_upload_runs_analysis_and_exposes_results():
    service = RepositoryIngestionService(Settings(_env_file=None))
    app.dependency_overrides[get_ingestion_service] = lambda: service
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/analyze/upload",
                files={
                    "file": (
                        "demo.zip",
                        zip_bytes({"demo/src/app.py": b"def main():\n    return 'ok'\n"}),
                        "application/zip",
                    )
                },
            )
            assert response.status_code == 200
            payload = response.json()
            assert payload["status"] == "INGESTED"
            assert payload["repository_name"] == "demo"
            assert payload["files"] == 1
            assert payload["python_files"] == 1
            assert payload["analysis_started"] is True
            assert payload["analysis_status"] == "COMPLETED"
            assert payload["analysis_id"]
            assert "was not executed" in payload["message"]

            result = client.get(f"/api/analysis/{payload['analysis_id']}")
            summary = client.get(f"/api/analysis/{payload['analysis_id']}/summary")
            metrics = client.get(f"/api/analysis/{payload['analysis_id']}/metrics")
            dependencies = client.get(f"/api/analysis/{payload['analysis_id']}/dependencies")
            ai_review = client.get(f"/api/analysis/{payload['analysis_id']}/ai-review")
            findings = client.get(f"/api/analysis/{payload['analysis_id']}/findings")
            architecture = client.get(f"/api/analysis/{payload['analysis_id']}/architecture")
            report = client.get(f"/api/analysis/{payload['analysis_id']}/report")
            assert result.status_code == 200
            assert result.json()["metrics"]["functions"] == 1
            assert result.json()["analysis_metadata"]["code_executed"] is False
            assert result.json()["ai_review"]["status"] == "not_configured"
            assert ai_review.status_code == 200
            assert ai_review.json()["status"] == "not_configured"
            assert summary.status_code == 200
            assert summary.json()["finding_count"] == 0
            assert metrics.status_code == 200
            assert metrics.json()["lines_of_code"] == 2
            assert dependencies.status_code == 200
            assert dependencies.json()["dependency_count"] == 0
            assert findings.status_code == 200
            assert findings.json()["findings"] == []
            assert architecture.status_code == 200
            assert architecture.json()["status"] == "INFERRED"
            assert "flowchart TD" in architecture.json()["mermaid"]
            assert report.status_code == 200
            assert "Static Analysis Report" in report.text
            missing = client.get("/api/analysis/not-a-real-analysis")
            assert missing.status_code == 404
    finally:
        app.dependency_overrides.pop(get_ingestion_service, None)
        service.cleanup()


def test_zip_upload_rejects_traversal_with_client_error():
    service = RepositoryIngestionService(Settings(_env_file=None))
    app.dependency_overrides[get_ingestion_service] = lambda: service
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/analyze/upload",
                files={
                    "file": (
                        "unsafe.zip",
                        zip_bytes({"../../escape.py": b"raise RuntimeError('never run')"}),
                        "application/zip",
                    )
                },
            )

        assert response.status_code == 422
        assert "traversal" in response.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_ingestion_service, None)
        service.cleanup()


def test_uploaded_demo_source_surfaces_smell_security_and_performance_findings(monkeypatch):
    from app.api import ingestion

    service = RepositoryIngestionService(Settings(_env_file=None))
    settings = Settings(
        _env_file=None,
        long_method_lines=4,
        large_class_methods=1,
        long_parameter_count=2,
        high_fan_out=1,
        high_complexity=2,
    )
    monkeypatch.setattr(ingestion, "get_settings", lambda: settings)
    app.dependency_overrides[get_ingestion_service] = lambda: service
    archive = zip_bytes(
        {
            "demo/api/routes.py": (
                b"import services.orders\n"
                b"import services.other\n"
                b"from database.store import save\n"
                b"import subprocess\n"
                b"\n"
                b"class Controller:\n"
                b"    def process(self, first, second, third):\n"
                b"        for row in first:\n"
                b"            for item in row:\n"
                b"                save(item)\n"
                b"        if second and third:\n"
                b"            eval(second)\n"
                b"            subprocess.run(third, shell=True)\n"
                b"        return True\n"
                b"\n"
                b"    def helper(self):\n"
                b"        return None\n"
            ),
            "demo/services/orders.py": b"import api.routes\nimport database.store\n",
            "demo/services/other.py": b"VALUE = 1\n",
            "demo/database/store.py": b"def save(value): return value\n",
        }
    )
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/analyze/upload",
                files={"file": ("demo.zip", archive, "application/zip")},
            )
            assert response.status_code == 200
            analysis_id = response.json()["analysis_id"]
            result = client.get(f"/api/analysis/{analysis_id}").json()
            specific_finding = next(item for item in result["findings"] if item["type"] == "Long Method")
            detail = client.get(
                f"/api/analysis/{analysis_id}/findings/{specific_finding['id']}"
            )

        finding_types = {finding["type"] for finding in result["findings"]}
        assert {
            "Long Method",
            "Large Class",
            "Long Parameter List",
            "Excessive Coupling",
            "Circular Dependency",
        } <= finding_types
        assert any(item.startswith("Potential security risk:") for item in finding_types)
        assert any(item.startswith("Potential performance bottleneck:") for item in finding_types)
        assert any(item.startswith("Potential DIP concern") for item in finding_types)
        assert result["dependency_graph"]["dependency_count"] == 5
        assert result["repository"]["status"] == "COMPLETED"
        assert specific_finding["source_snippet"]["line_start"] <= specific_finding["line"]
        assert "def process" in specific_finding["source_snippet"]["text"]
        assert detail.status_code == 200
        assert detail.json()["id"] == specific_finding["id"]
    finally:
        app.dependency_overrides.pop(get_ingestion_service, None)
        service.cleanup()


def test_github_endpoint_validates_input_before_network_access():
    service = RepositoryIngestionService(Settings(_env_file=None))
    app.dependency_overrides[get_ingestion_service] = lambda: service
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/analyze/github",
                json={"url": "https://github.com.evil.example/owner/repository"},
            )

        assert response.status_code == 422
        assert "github.com" in response.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_ingestion_service, None)
        service.cleanup()


def test_github_endpoint_stages_archive_from_validated_repository(monkeypatch):
    service = RepositoryIngestionService(Settings(_env_file=None))
    archive_data = zip_bytes({"owner-project/src/app.py": b"def main(): return 1\n"})

    def fake_download(owner: str, repository: str, destination):
        assert owner == "owner"
        assert repository == "project"
        destination.write_bytes(archive_data)
        return len(archive_data)

    monkeypatch.setattr(service, "_download_archive", fake_download)
    app.dependency_overrides[get_ingestion_service] = lambda: service
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/analyze/github",
                json={"url": "https://github.com/owner/project"},
            )

        assert response.status_code == 200
        payload = response.json()
        assert payload["source"] == "https://github.com/owner/project"
        assert payload["python_files"] == 1
        assert payload["analysis_started"] is True
        assert payload["analysis_status"] == "COMPLETED"
    finally:
        app.dependency_overrides.pop(get_ingestion_service, None)
        service.cleanup()

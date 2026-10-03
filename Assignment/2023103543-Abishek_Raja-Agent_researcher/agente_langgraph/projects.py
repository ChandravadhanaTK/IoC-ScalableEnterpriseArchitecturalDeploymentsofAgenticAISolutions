import json
import os
import uuid
import datetime

PROJECTS_FILE = os.path.join(os.path.dirname(__file__), "..", "projects.json")


def _load() -> list[dict]:
    if not os.path.exists(PROJECTS_FILE):
        return []
    with open(PROJECTS_FILE, "r") as f:
        return json.load(f)


def _save(projects: list[dict]):
    with open(PROJECTS_FILE, "w") as f:
        json.dump(projects, f, indent=2, ensure_ascii=False)


def list_projects() -> list[dict]:
    return _load()


def create_project(name: str) -> dict:
    projects = _load()
    project = {
        "id": uuid.uuid4().hex[:12],
        "name": name,
        "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    projects.append(project)
    _save(projects)
    return project


def delete_project(project_id: str) -> bool:
    projects = _load()
    filtered = [p for p in projects if p["id"] != project_id]
    if len(filtered) == len(projects):
        return False
    _save(filtered)
    return True

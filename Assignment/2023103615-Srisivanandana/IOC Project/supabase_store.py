import json
from datetime import date
from pathlib import Path
from typing import Any

from supabase import Client

SEED_PATH = Path(__file__).resolve().parent / "campus_data.json"
TABLES = ("classes", "assignments", "exams", "placements", "study_progress", "tasks", "events")


class CampusStore:
    """Supabase data access bound to one authenticated Supabase user session."""

    def __init__(self, client: Client, user_id: str):
        if not user_id:
            raise ValueError("An authenticated user ID is required.")
        self.client = client
        self.user_id = str(user_id)

    @staticmethod
    def _rows(response):
        return list(getattr(response, "data", None) or [])

    def _select(self, table: str) -> list[dict[str, Any]]:
        return self._rows(
            self.client.table(table)
            .select("*")
            .eq("user_id", self.user_id)
            .execute()
        )

    def get_profile(self) -> dict[str, Any]:
        rows = self._rows(
            self.client.table("profiles")
            .select("id,full_name,email,course,semester,created_at,updated_at")
            .eq("id", self.user_id)
            .limit(1)
            .execute()
        )
        if not rows:
            return {"id": self.user_id, "name": "Student", "course": "", "semester": 1}
        profile = rows[0]
        return {
            **profile,
            "name": profile.get("full_name") or "Student",
        }

    def update_profile(self, full_name: str, course: str, semester: int) -> dict[str, Any]:
        values = {
            "full_name": full_name.strip(),
            "course": course.strip(),
            "semester": int(semester),
        }
        rows = self._rows(
            self.client.table("profiles")
            .update(values)
            .eq("id", self.user_id)
            .execute()
        )
        return rows[0] if rows else {"id": self.user_id, **values}

    def get_all_data(self) -> dict[str, Any]:
        profile = self.get_profile()
        data = {
            "student": profile,
            "classes": self._select("classes"),
            "assignments": self._select("assignments"),
            "exams": self._select("exams"),
            "placements": self._select("placements"),
            "study_progress": self._select("study_progress"),
            "tasks": self._select("tasks"),
            "events": self._select("events"),
        }
        for row in data["exams"]:
            row["date"] = row.pop("exam_date", None)
            row["topics"] = [line.strip() for line in (row.get("topics") or "").splitlines() if line.strip()]
        for row in data["assignments"]:
            row["deadline"] = self._date_part(row.get("deadline"))
        for row in data["placements"]:
            row["oa_date"] = self._date_part(row.get("oa_date"))
            row["interview_date"] = self._date_part(row.get("interview_date"))
        for row in data["tasks"]:
            row["deadline"] = self._date_part(row.get("deadline"))
        return data

    @staticmethod
    def _date_part(value):
        if not value:
            return ""
        return str(value).split("T", 1)[0]

    def get_rows(self, table: str, *, order_by: str | None = None) -> list[dict[str, Any]]:
        if table not in TABLES:
            raise ValueError("Unsupported campus table.")
        rows = self._select(table)
        if order_by:
            rows.sort(key=lambda row: row.get(order_by) or "9999-12-31")
        return rows

    def insert(self, table: str, values: dict[str, Any]) -> dict[str, Any]:
        if table not in TABLES:
            raise ValueError("Unsupported campus table.")
        payload = {key: value for key, value in values.items() if key not in {"id", "user_id", "created_at", "updated_at"}}
        payload["user_id"] = self.user_id
        rows = self._rows(self.client.table(table).insert(payload).execute())
        if not rows:
            raise RuntimeError("Supabase did not return the inserted record.")
        return rows[0]

    def update(self, table: str, record_id: str, values: dict[str, Any]) -> dict[str, Any] | None:
        if table not in TABLES:
            raise ValueError("Unsupported campus table.")
        payload = {key: value for key, value in values.items() if key not in {"id", "user_id", "created_at", "updated_at"}}
        if not payload:
            return None
        (
            self.client.table(table)
            .update(payload)
            .eq("id", record_id)
            .eq("user_id", self.user_id)
            .execute()
        )
        return next((row for row in self._select(table) if str(row.get("id")) == str(record_id)), None)

    def delete(self, table: str, record_id: str) -> bool:
        if table not in TABLES:
            raise ValueError("Unsupported campus table.")
        owned_record = self._rows(
            self.client.table(table)
            .select("id")
            .eq("id", record_id)
            .eq("user_id", self.user_id)
            .limit(1)
            .execute()
        )
        if not owned_record:
            return False
        self.client.table(table).delete().eq("id", record_id).eq("user_id", self.user_id).execute()
        return True

    def has_campus_data(self) -> bool:
        for table in TABLES:
            response = self.client.table(table).select("id").eq("user_id", self.user_id).limit(1).execute()
            if self._rows(response):
                return True
        return False

    def load_demo_data(self) -> int:
        if self.has_campus_data():
            raise RuntimeError("Demo data can only be loaded into an empty workspace.")
        with SEED_PATH.open("r", encoding="utf-8") as seed_file:
            seed = json.load(seed_file)
        inserted = 0
        converters = {
            "exams": self._exam_payload,
            "assignments": self._assignment_payload,
            "placements": self._placement_payload,
            "classes": self._class_payload,
            "study_progress": self._study_payload,
            "tasks": self._task_payload,
            "events": self._event_payload,
        }
        for table, converter in converters.items():
            for record in seed.get(table, []):
                self.insert(table, converter(record))
                inserted += 1
        return inserted

    @staticmethod
    def _exam_payload(record):
        return {"subject": record.get("subject", ""), "exam_date": record.get("date"), "topics": "\n".join(record.get("topics", []))}

    @staticmethod
    def _assignment_payload(record):
        return {
            "title": record.get("title", ""),
            "subject": record.get("subject"),
            "deadline": record.get("deadline"),
            "priority": record.get("priority", "Medium"),
            "status": record.get("status", "pending"),
            "estimated_hours": record.get("estimated_hours"),
        }

    @staticmethod
    def _placement_payload(record):
        return {
            "company": record.get("company", ""),
            "role": record.get("role"),
            "stage": record.get("stage"),
            "oa_date": record.get("oa_date") or None,
            "interview_date": record.get("interview_date") or None,
            "status": record.get("status"),
        }

    @staticmethod
    def _class_payload(record):
        return {key: record.get(key) for key in ("subject", "date", "start_time", "end_time", "room")}

    @staticmethod
    def _study_payload(record):
        return {key: record.get(key) for key in ("topic", "subject", "mastery", "last_studied")}

    @staticmethod
    def _task_payload(record):
        return {key: record.get(key) for key in ("title", "deadline", "priority", "status", "source")}

    @staticmethod
    def _event_payload(record):
        return {key: record.get(key) for key in ("name", "date", "time", "venue", "category")}

    def get_today_schedule(self, today: date) -> dict[str, Any]:
        data = self.get_all_data()
        today_text = today.isoformat()
        return {
            "date": today_text,
            "classes": [row for row in data["classes"] if row.get("date") == today_text],
            "events": [row for row in data["events"] if row.get("date") == today_text],
        }

    def get_pending_assignments(self) -> list[dict[str, Any]]:
        rows = [row for row in self._select("assignments") if row.get("status") != "completed"]
        for row in rows:
            row["deadline"] = self._date_part(row.get("deadline"))
        return sorted(rows, key=lambda row: row.get("deadline") or "9999-12-31")

    def get_upcoming_exams(self) -> list[dict[str, Any]]:
        rows = self._select("exams")
        for row in rows:
            row["date"] = row.pop("exam_date", None)
            row["topics"] = [line.strip() for line in (row.get("topics") or "").splitlines() if line.strip()]
        return sorted(rows, key=lambda row: row.get("date") or "9999-12-31")

    def get_placement_deadlines(self) -> list[dict[str, Any]]:
        rows = self._select("placements")
        for row in rows:
            row["oa_date"] = self._date_part(row.get("oa_date"))
            row["interview_date"] = self._date_part(row.get("interview_date"))
        return sorted(rows, key=lambda row: min(row.get("oa_date") or "9999-12-31", row.get("interview_date") or "9999-12-31"))

    def get_study_progress(self) -> list[dict[str, Any]]:
        return sorted(self._select("study_progress"), key=lambda row: row.get("mastery") or 0)

    def get_tasks(self) -> list[dict[str, Any]]:
        rows = self._select("tasks")
        for row in rows:
            row["deadline"] = self._date_part(row.get("deadline"))
        return sorted(rows, key=lambda row: row.get("deadline") or "9999-12-31")

    def create_task(self, title: str, deadline: str, priority="Medium", source="manual") -> dict[str, Any]:
        existing = next(
            (task for task in self.get_tasks() if task.get("status") != "completed" and task.get("title", "").strip().casefold() == title.strip().casefold()),
            None,
        )
        if existing:
            return existing
        rows = self._rows(
            self.client.table("tasks").insert({
                "user_id": self.user_id,
                "title": title.strip(),
                "deadline": deadline or None,
                "priority": priority.title(),
                "status": "pending",
                "source": source,
            }).execute()
        )
        if not rows:
            raise RuntimeError("Supabase did not return the created task.")
        return rows[0]

    def complete_task(self, task_id: str) -> dict[str, Any] | None:
        (
            self.client.table("tasks")
            .update({"status": "completed"})
            .eq("id", str(task_id))
            .eq("user_id", self.user_id)
            .execute()
        )
        return next((task for task in self.get_tasks() if str(task.get("id")) == str(task_id)), None)

    def delete_task(self, task_id: str) -> bool:
        return self.delete("tasks", task_id)

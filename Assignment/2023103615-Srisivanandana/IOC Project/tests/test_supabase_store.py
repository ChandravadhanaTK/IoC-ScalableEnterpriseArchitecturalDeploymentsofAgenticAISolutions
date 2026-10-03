import unittest
from pathlib import Path

from supabase_store import CampusStore
from agent import _allows_task_mutation, agent_response, get_tool_definitions


class Response:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, client, table):
        self.client = client
        self.table = table
        self.operation = "select"
        self.payload = None
        self.filters = []
        self.limit_count = None

    def select(self, _columns):
        self.operation = "select"
        return self

    def insert(self, payload):
        self.operation = "insert"
        self.payload = dict(payload)
        return self

    def update(self, payload):
        self.operation = "update"
        self.payload = dict(payload)
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def eq(self, key, value):
        self.filters.append((key, value))
        return self

    def limit(self, count):
        self.limit_count = count
        return self

    def execute(self):
        rows = self.client.rows.setdefault(self.table, [])
        if self.operation == "insert":
            row = {"id": f"new-{len(rows)}", **self.payload}
            rows.append(row)
            return Response([row])

        matches = [
            row for row in rows
            if all(row.get(key) == value for key, value in self.filters)
        ]
        if self.operation == "select":
            self.client.select_filters.append((self.table, tuple(self.filters)))
            if self.limit_count is not None:
                matches = matches[:self.limit_count]
            return Response([dict(row) for row in matches])
        if self.operation == "update":
            for row in matches:
                row.update(self.payload)
            self.client.mutation_filters.append((self.table, self.operation, tuple(self.filters)))
            return Response([dict(row) for row in matches])
        if self.operation == "delete":
            self.client.mutation_filters.append((self.table, self.operation, tuple(self.filters)))
            for row in matches:
                rows.remove(row)
            return Response([dict(row) for row in matches])
        raise AssertionError(self.operation)


class FakeClient:
    def __init__(self):
        self.rows = {"tasks": [
            {"id": "a-task", "user_id": "user-a", "title": "A task", "status": "pending", "deadline": "2026-10-03", "priority": "High"},
            {"id": "b-task", "user_id": "user-b", "title": "B task", "status": "pending", "deadline": "2026-10-03", "priority": "High"},
        ]}
        self.select_filters = []
        self.mutation_filters = []

    def table(self, name):
        return FakeQuery(self, name)


class CampusStoreIsolationTests(unittest.TestCase):
    def setUp(self):
        self.client = FakeClient()
        self.user_a = CampusStore(self.client, "user-a")
        self.user_b = CampusStore(self.client, "user-b")

    def test_users_only_read_their_own_records(self):
        self.assertEqual([row["title"] for row in self.user_a.get_tasks()], ["A task"])
        self.assertEqual([row["title"] for row in self.user_b.get_tasks()], ["B task"])
        filters = [filters for table, filters in self.client.select_filters if table == "tasks"]
        self.assertIn(("user_id", "user-a"), filters[0])
        self.assertIn(("user_id", "user-b"), filters[1])

    def test_insert_uses_bound_user_not_payload_user(self):
        task = self.user_a.insert("tasks", {"title": "New task", "user_id": "user-b", "priority": "Low"})
        self.assertEqual(task["user_id"], "user-a")

    def test_update_and_completion_cannot_mutate_another_users_record(self):
        self.assertIsNone(self.user_a.update("tasks", "b-task", {"title": "Changed"}))
        self.assertIsNone(self.user_a.complete_task("b-task"))
        other_user_task = next(row for row in self.client.rows["tasks"] if row["id"] == "b-task")
        self.assertEqual(other_user_task["status"], "pending")
        self.assertTrue(all(("user_id", "user-a") in filters for table, operation, filters in self.client.mutation_filters))

    def test_delete_cannot_remove_another_users_record(self):
        self.assertFalse(self.user_a.delete("tasks", "b-task"))
        self.assertTrue(any(row["id"] == "b-task" for row in self.client.rows["tasks"]))

    def test_schema_enables_rls_for_all_application_tables(self):
        schema = (Path(__file__).resolve().parents[1] / "supabase" / "schema.sql").read_text(encoding="utf-8").lower()
        for table in ("profiles", "classes", "assignments", "exams", "placements", "study_progress", "tasks", "events"):
            self.assertIn(f"alter table public.{table} enable row level security", schema)
            self.assertIn(f"on public.{table}", schema)
        self.assertIn("user_id = (select auth.uid())", schema)
        self.assertIn("id = (select auth.uid())", schema)
        self.assertNotIn("password text", schema)

    def test_agent_tools_cannot_choose_a_user_id(self):
        for definition in get_tool_definitions():
            properties = definition["function"]["parameters"].get("properties", {})
            self.assertNotIn("user_id", properties)

    def test_agent_fails_closed_without_authenticated_store(self):
        result = agent_response("What should I focus on today?")
        self.assertEqual(result["status"], "error")

    def test_task_mutation_tools_require_an_explicit_request(self):
        self.assertFalse(_allows_task_mutation("What should I focus on today?", "create_task"))
        self.assertFalse(_allows_task_mutation("Show me my assignments", "complete_task"))
        self.assertTrue(_allows_task_mutation("Add a task to prepare for LoadShare OA", "create_task"))
        self.assertTrue(_allows_task_mutation("I finished my AI assignment", "complete_task"))


if __name__ == "__main__":
    unittest.main()

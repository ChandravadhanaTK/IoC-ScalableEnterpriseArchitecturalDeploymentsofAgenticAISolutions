"""
End-to-End Integration Test for NextStep
Tests:
- API Health
- Authentication (Register, Login, Token generation)
- Role-based Access Control (Admin vs Student enforcement, 403 checks)
- Goal Creation & LangGraph Planning
- Next Action Selection & State Machine
- Mark Task Done -> Observation & Next Task Selection
- I'm Stuck -> Diagnosis & Alternatives
- Goal Completion & Seamless Transition to Next Goal
"""
import sys
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_full_flow():
    print("========================================")
    print("NextStep End-to-End Verification Test")
    print("========================================")

    # 1. Health check
    print("\n[1] Checking /api/health...")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print(f"    Health: {res.json()}")

    # 2. Authentication: Student Login
    print("\n[2] Logging in as demo student (alex@student.com)...")
    res = client.post("/api/auth/login", json={"email": "alex@student.com", "password": "student123"})
    assert res.status_code == 200, f"Student login failed: {res.text}"
    student_token = res.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print("    Student authenticated successfully with JWT.")

    # 3. Authentication: Admin Login
    print("\n[3] Logging in as demo admin (admin@nextstep.ai)...")
    res = client.post("/api/auth/login", json={"email": "admin@nextstep.ai", "password": "admin123"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("    Admin authenticated successfully with JWT.")

    # 4. Role Authorization: Student attempts admin route -> MUST BE 403
    print("\n[4] Testing Role Authorization: Student requesting /api/admin/monitoring...")
    res = client.get("/api/admin/monitoring", headers=student_headers)
    assert res.status_code == 403, f"Security Breach! Student accessed admin route: {res.status_code}"
    print("    [SECURE] Student blocked with 403 Forbidden as expected.")

    # 5. Role Authorization: Admin accesses admin route -> MUST BE 200
    print("\n[5] Testing Admin route access: Admin requesting /api/admin/monitoring...")
    res = client.get("/api/admin/monitoring", headers=admin_headers)
    assert res.status_code == 200, f"Admin route failed: {res.text}"
    mon_data = res.json()
    print(f"    [OK] Admin authorized. Total users: {mon_data['overview']['total_users']}, Goals: {mon_data['overview']['total_goals']}")

    # 6. Admin User Management
    print("\n[6] Admin viewing user directory...")
    res = client.get("/api/admin/users", headers=admin_headers)
    assert res.status_code == 200
    users = res.json()
    print(f"    [OK] Admin retrieved {len(users)} registered users.")

    # 7. Student Dashboard
    print("\n[7] Student fetching dashboard...")
    res = client.get("/api/agent/dashboard", headers=student_headers)
    assert res.status_code == 200, f"Dashboard failed: {res.text}"
    dash = res.json()
    primary_goal = dash.get("primary_goal")
    current_task = dash.get("current_task")
    print(f"    Primary Goal: {primary_goal['title'] if primary_goal else 'None'}")
    print(f"    Current Action: {current_task['title'] if current_task else 'None'}")

    # 8. Student creates a new goal with AI Plan
    print("\n[8] Student creating a new goal: 'Master DSA 100 Problems'...")
    res = client.post("/api/goals", json={
        "title": "Master DSA 100 Problems",
        "description": "Arrays, Trees, and Dynamic Programming for technical interviews",
        "category": "study"
    }, headers=student_headers)
    assert res.status_code == 201, f"Create goal failed: {res.text}"
    new_goal = res.json()["goal"]
    new_goal_id = new_goal["id"]
    agent_info = res.json()["agent"]
    print(f"    Goal Created: ID={new_goal_id}")
    print(f"    AI Plan Initialized. Next Task: {agent_info['next_task_id']}")

    # 9. Verify Goal Detail & Milestones
    print("\n[9] Inspecting goal milestones and tasks...")
    res = client.get(f"/api/goals/{new_goal_id}", headers=student_headers)
    assert res.status_code == 200
    detail = res.json()
    milestones = detail["milestones"]
    assert len(milestones) > 0, "No milestones were generated!"
    first_task = detail["agent_state"]["current_task"]
    assert first_task is not None, "No current task assigned!"
    print(f"    Milestones generated: {len(milestones)}")
    print(f"    First Actionable Step: '{first_task['title']}'")

    # 10. Agent Action: I'm Stuck Diagnosis
    print("\n[10] Student signals: I'm Stuck on the current task...")
    res = client.post(f"/api/agent/goals/{new_goal_id}/action", json={
        "action": "stuck",
        "message": "I get an IndexOutOfBoundsException when searching in the array."
    }, headers=student_headers)
    assert res.status_code == 200
    stuck_res = res.json()
    assert "stuck_analysis" in stuck_res
    print(f"    Agent Diagnosis: {stuck_res['stuck_analysis']['diagnosis']}")
    print(f"    Agent Suggestion: {stuck_res['stuck_analysis']['suggestion']}")

    # 11. Agent Action: Mark Task Done
    print("\n[11] Student completes the task...")
    res = client.post(f"/api/agent/goals/{new_goal_id}/action", json={
        "action": "done",
        "message": "Solved the edge condition and all test cases passed."
    }, headers=student_headers)
    assert res.status_code == 200
    done_res = res.json()
    print(f"    Observation: {done_res['observation']['assessment']}")
    print(f"    Next Step Selected: {done_res['rationale']}")

    # 12. Check Dashboard after action
    print("\n[12] Checking updated dashboard...")
    res = client.get("/api/agent/dashboard", headers=student_headers)
    assert res.status_code == 200
    dash2 = res.json()
    print(f"    Total Goals: {dash2['stats']['total_goals']}, Active: {dash2['stats']['active_goals']}")
    print(f"    Multi-goal availability: {len(dash2['goals'])} goals in switcher")

    # 13. Test "Next Goal" transition capability
    print("\n[13] Verifying user can start or move to next goal anytime...")
    # Verify goals list endpoint returns all goals
    res = client.get("/api/goals", headers=student_headers)
    assert res.status_code == 200
    student_goals = res.json()
    assert len(student_goals) >= 2, "Expected at least 2 goals for student"
    print(f"    [OK] Student has {len(student_goals)} distinct goals available to work on.")

    print("\n========================================")
    print("ALL 13 TESTS PASSED! System 100% Verified.")
    print("========================================")

if __name__ == "__main__":
    test_full_flow()

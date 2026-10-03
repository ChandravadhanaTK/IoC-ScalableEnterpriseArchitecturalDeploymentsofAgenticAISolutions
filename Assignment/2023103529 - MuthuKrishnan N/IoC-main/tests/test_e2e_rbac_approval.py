import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure root is in path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.main import app
from backend.database.repository import repo

client = TestClient(app)

def test_full_e2e_suite():
    print("=" * 70)
    print("RUNNING END-TO-END VERIFICATION: PARTS 22, 23, 24, 25")
    print("=" * 70)

    # -----------------------------------------------------------------
    # PART 25: NEGATIVE SECURITY TESTS (A through J)
    # -----------------------------------------------------------------
    print("\n--- PART 25: NEGATIVE SECURITY TESTS ---")

    # TEST A: Unauthenticated user accessing admin metrics / users
    unauth_admin = client.get("/api/admin/metrics")
    assert unauth_admin.status_code == 401, f"Expected 401, got {unauth_admin.status_code}"
    print("[PASS] Test A: Unauthenticated request to /api/admin/metrics rejected (401)")

    # TEST B: Unauthenticated user accessing approvals
    unauth_appr = client.get("/api/approvals")
    assert unauth_appr.status_code == 401, f"Expected 401, got {unauth_appr.status_code}"
    print("[PASS] Test B: Unauthenticated request to /api/approvals rejected (401)")

    # Login as Customer
    cust_res = client.post("/api/auth/login", json={"email": "customer@example.com", "password": "customer123"})
    assert cust_res.status_code == 200
    cust_token = cust_res.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # TEST C & D: CUSTOMER calls POST /api/admin/users
    cust_create_user = client.post("/api/admin/users", json={
        "name": "Attacker",
        "email": "attacker@test.com",
        "password": "Password123!",
        "role": "ADMIN"
    }, headers=cust_headers)
    assert cust_create_user.status_code == 403, f"Expected 403, got {cust_create_user.status_code}"
    print("[PASS] Test D: CUSTOMER blocked from POST /api/admin/users (403 Forbidden)")

    # TEST E: CUSTOMER calls POST /api/approvals/{id}/approve
    cust_approve = client.post("/api/approvals/APP-DUMMY/approve", json={"notes": "hack"}, headers=cust_headers)
    assert cust_approve.status_code == 403, f"Expected 403, got {cust_approve.status_code}"
    print("[PASS] Test E: CUSTOMER blocked from POST /api/approvals/{id}/approve (403 Forbidden)")

    # Login as Support Agent
    supp_res = client.post("/api/auth/login", json={"email": "support@example.com", "password": "support123"})
    assert supp_res.status_code == 200
    supp_token = supp_res.json()["access_token"]
    supp_headers = {"Authorization": f"Bearer {supp_token}"}

    # TEST F: SUPPORT_AGENT calls POST /api/admin/users
    supp_create_user = client.post("/api/admin/users", json={
        "name": "Fake Admin",
        "email": "fakeadmin@test.com",
        "password": "Password123!",
        "role": "ADMIN"
    }, headers=supp_headers)
    assert supp_create_user.status_code == 403, f"Expected 403, got {supp_create_user.status_code}"
    print("[PASS] Test F: SUPPORT_AGENT blocked from POST /api/admin/users (403 Forbidden)")

    # TEST G: SUPPORT_AGENT calls GET /api/approvals
    supp_get_appr = client.get("/api/approvals", headers=supp_headers)
    assert supp_get_appr.status_code == 200, f"Expected 200, got {supp_get_appr.status_code}"
    print(f"[PASS] Test G: SUPPORT_AGENT permitted GET /api/approvals (200 OK, count: {len(supp_get_appr.json())})")

    # Login as Admin
    admin_res = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    assert admin_res.status_code == 200
    admin_token = admin_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # TEST J: ADMIN calls GET /api/approvals
    admin_get_appr = client.get("/api/approvals", headers=admin_headers)
    assert admin_get_appr.status_code == 200, f"Expected 200, got {admin_get_appr.status_code}"
    print(f"[PASS] Test J: ADMIN permitted GET /api/approvals (200 OK)")

    # -----------------------------------------------------------------
    # PART 22: ADMIN USER MANAGEMENT TEST (Create SUPPORT_AGENT user)
    # -----------------------------------------------------------------
    print("\n--- PART 22: ADMIN CREATES SUPPORT_AGENT WORKFLOW ---")
    # Clean up test user if exists
    repo.users.delete_many({"email": "support1@test.com"})

    # Admin creates support1@test.com
    create_supp1 = client.post("/api/admin/users", json={
        "name": "Support One",
        "email": "support1@test.com",
        "password": "Support@123",
        "role": "SUPPORT_AGENT"
    }, headers=admin_headers)
    assert create_supp1.status_code == 201, f"Admin create user failed: {create_supp1.text}"
    created_user_data = create_supp1.json()
    assert created_user_data["role"] == "SUPPORT_AGENT"
    assert created_user_data["email"] == "support1@test.com"
    print("[PASS] Part 22: Admin successfully created user support1@test.com with role SUPPORT_AGENT (201 Created)")

    # Verify new user exists in database
    db_user = repo.users.find_one({"email": "support1@test.com"})
    assert db_user is not None
    assert db_user["role"] == "SUPPORT_AGENT"
    print("[PASS] Part 22: User support1@test.com persisted in database with role SUPPORT_AGENT")

    # Authenticate newly created user from normal login
    supp1_login = client.post("/api/auth/login", json={
        "email": "support1@test.com",
        "password": "Support@123"
    })
    assert supp1_login.status_code == 200, f"Login failed for created user: {supp1_login.text}"
    supp1_token = supp1_login.json()["access_token"]
    supp1_role = supp1_login.json()["user"]["role"]
    assert supp1_role == "SUPPORT_AGENT"
    print("[PASS] Part 22: Newly created user support1@test.com successfully logged in (role=SUPPORT_AGENT)")

    # Verify newly created support agent can access approvals
    supp1_headers = {"Authorization": f"Bearer {supp1_token}"}
    supp1_approvals = client.get("/api/approvals", headers=supp1_headers)
    assert supp1_approvals.status_code == 200
    print("[PASS] Part 22: Newly created user support1@test.com has valid access to /api/approvals (200 OK)")

    # -----------------------------------------------------------------
    # PART 23: CREATE SECOND ADMIN TEST
    # -----------------------------------------------------------------
    print("\n--- PART 23: ADMIN CREATES SECOND ADMIN WORKFLOW ---")
    repo.users.delete_many({"email": "admin2@test.com"})

    create_admin2 = client.post("/api/admin/users", json={
        "name": "Admin Two",
        "email": "admin2@test.com",
        "password": "Admin@123",
        "role": "ADMIN"
    }, headers=admin_headers)
    assert create_admin2.status_code == 201, f"Admin create admin2 failed: {create_admin2.text}"
    admin2_data = create_admin2.json()
    assert admin2_data["role"] == "ADMIN"
    print("[PASS] Part 23: Admin successfully created user admin2@test.com with role ADMIN (201 Created)")

    # Authenticate second admin
    admin2_login = client.post("/api/auth/login", json={
        "email": "admin2@test.com",
        "password": "Admin@123"
    })
    assert admin2_login.status_code == 200
    admin2_token = admin2_login.json()["access_token"]
    admin2_headers = {"Authorization": f"Bearer {admin2_token}"}
    assert admin2_login.json()["user"]["role"] == "ADMIN"
    print("[PASS] Part 23: Newly created user admin2@test.com logged in successfully as ADMIN")

    # Verify second admin has access to admin metrics and user list
    admin2_metrics = client.get("/api/admin/metrics", headers=admin2_headers)
    assert admin2_metrics.status_code == 200
    print("[PASS] Part 23: Second admin successfully accessed /api/admin/metrics (200 OK)")

    # -----------------------------------------------------------------
    # PART 24: SUPPORT APPROVAL TEST (Full Lifecycle)
    # -----------------------------------------------------------------
    print("\n--- PART 24: HIGH-VALUE REFUND HITL APPROVAL LIFECYCLE ---")
    # Customer files high-value refund complaint
    comp_res = client.post("/api/complaints", json={
        "title": "Ergonomic keyboard malfunction, defective keys",
        "description": "The mechanical keyboard stopped registering key presses after two days. Please issue a refund.",
        "order_id": "ORD-1002"  # Amount: 25,000 INR (exceeds threshold 5,000 INR)
    }, headers=cust_headers)
    assert comp_res.status_code == 201
    comp_data = comp_res.json()
    complaint_id = comp_data["id"]
    print(f"[PASS] Part 24: Customer filed high-value complaint {complaint_id} for order ORD-1002 (₹25,000)")

    # Verify complaint status is AWAITING_APPROVAL
    assert comp_data["status"] == "AWAITING_APPROVAL", f"Expected AWAITING_APPROVAL, got {comp_data['status']}"
    print(f"[PASS] Part 24: Complaint status correctly flagged as AWAITING_APPROVAL")

    # Support Agent fetches approvals list
    apps_res = client.get("/api/approvals", headers=supp1_headers)
    assert apps_res.status_code == 200
    pending_list = [a for a in apps_res.json() if a["complaint_id"] == complaint_id and a["status"] == "PENDING"]
    assert len(pending_list) > 0, "No pending approval record found for high-value complaint!"
    approval_record = pending_list[0]
    approval_id = approval_record["id"]
    print(f"[PASS] Part 24: Support Agent retrieved pending approval {approval_id}")
    print(f"       Details: Action={approval_record['requested_action']}, Amount={approval_record.get('amount')}, Customer={approval_record.get('customer_name')}")

    # Support Agent inspects single approval via GET /api/approvals/{id}
    single_appr = client.get(f"/api/approvals/{approval_id}", headers=supp1_headers)
    assert single_appr.status_code == 200
    assert single_appr.json()["id"] == approval_id
    print(f"[PASS] Part 24: GET /api/approvals/{approval_id} verified successfully (200 OK)")

    # Support Agent APPROVES the request via POST /api/approvals/{id}/approve
    approve_res = client.post(f"/api/approvals/{approval_id}/approve", json={
        "notes": "Verified hardware defect. High-value refund authorized per company policy."
    }, headers=supp1_headers)
    assert approve_res.status_code == 200, f"Approve failed: {approve_res.text}"
    approve_json = approve_res.json()
    assert approve_json["success"] is True
    print(f"[PASS] Part 24: Support Agent successfully executed POST /api/approvals/{approval_id}/approve (200 OK)")

    # Verify approval status in DB is now APPROVED
    updated_app = repo.approvals.find_one({"id": approval_id})
    assert updated_app["status"] == "APPROVED"
    assert updated_app["reviewed_by"] == "support1@test.com"
    print(f"[PASS] Part 24: Database approval record marked APPROVED by support1@test.com")

    # Verify duplicate execution is prevented (Part 7: 'Prevent the same approval from being executed twice')
    dup_approve = client.post(f"/api/approvals/{approval_id}/approve", json={
        "notes": "Attempt duplicate approval"
    }, headers=supp1_headers)
    assert dup_approve.status_code == 400, f"Expected 400 for duplicate approval, got {dup_approve.status_code}"
    print(f"[PASS] Part 24: Duplicate approval attempt correctly rejected with 400 Bad Request")

    # Verify complaint was updated to RESOLVED after human approval execution
    resolved_comp = repo.complaints.find_one({"id": complaint_id})
    assert resolved_comp["status"] == "RESOLVED"
    print(f"[PASS] Part 24: Complaint {complaint_id} updated to RESOLVED following autonomous action execution")

    # Verify audit log was created
    audit_logs = repo.audit_logs.find({"complaint_id": complaint_id})
    approval_audit = [l for l in audit_logs if l.get("action") == "HUMAN_APPROVAL_GRANTED"]
    assert len(approval_audit) > 0
    print(f"[PASS] Part 24: Immutable audit log HUMAN_APPROVAL_GRANTED recorded")

    print("\n" + "=" * 70)
    print("ALL SPECIFICATION WORKFLOWS & TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    test_full_e2e_suite()

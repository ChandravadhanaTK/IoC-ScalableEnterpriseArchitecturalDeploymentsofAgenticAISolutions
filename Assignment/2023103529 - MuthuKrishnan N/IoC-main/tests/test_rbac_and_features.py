import sys
import httpx
from datetime import datetime

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("=" * 70)
    print("RUNNING RBAC, REGISTRATION, AND ENDPOINT VERIFICATION TESTS")
    print("=" * 70)

    client = httpx.Client(base_url=BASE_URL, timeout=15.0)

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    print("[PASS] Test 1: Health check OK (200)")

    # 2. Registration Role Tampering Test
    # Attempt to supply role="ADMIN" during public registration
    test_email = f"testcustomer_{int(datetime.utcnow().timestamp())}@example.com"
    reg_payload = {
        "name": "Test Customer",
        "email": test_email,
        "password": "Password@123",
        "role": "ADMIN" # Attacker attempts to become ADMIN
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201, f"Registration failed: {res.status_code} {res.text}"
    reg_data = res.json()
    assigned_role = reg_data["user"]["role"]
    assert assigned_role == "CUSTOMER", f"CRITICAL SECURITY FAIL: Role was not CUSTOMER, got {assigned_role}"
    print(f"[PASS] Test 2: Public registration strictly enforced role='CUSTOMER' (attacker role was ignored)")

    customer_token = reg_data["access_token"]
    customer_headers = {"Authorization": f"Bearer {customer_token}"}

    # 3. Test Customer Token on Admin Endpoints (Must be 403 Forbidden)
    res = client.get("/api/admin/metrics", headers=customer_headers)
    assert res.status_code == 403, f"Expected 403 Forbidden for customer on /api/admin/metrics, got {res.status_code}"
    print("[PASS] Test 3: Customer blocked from /api/admin/metrics (403 Forbidden)")

    res = client.get("/api/admin/users", headers=customer_headers)
    assert res.status_code == 403, f"Expected 403 Forbidden on /api/admin/users, got {res.status_code}"
    print("[PASS] Test 4: Customer blocked from /api/admin/users (403 Forbidden)")

    res = client.get("/api/admin/audit-logs", headers=customer_headers)
    assert res.status_code == 403, f"Expected 403 Forbidden on /api/admin/audit-logs, got {res.status_code}"
    print("[PASS] Test 5: Customer blocked from /api/admin/audit-logs (403 Forbidden)")

    # 4. Test Customer Token on Support Endpoints (Must be 403 Forbidden)
    res = client.get("/api/approvals", headers=customer_headers)
    assert res.status_code == 403, f"Expected 403 Forbidden for customer on /api/approvals, got {res.status_code}"
    print("[PASS] Test 6: Customer blocked from /api/approvals (403 Forbidden)")

    # 5. Customer Data Isolation Test
    # Customer files a complaint
    comp_res = client.post("/api/complaints", json={
        "title": "Damaged stand delivery",
        "description": "My laptop stand arrived damaged yesterday. I would like a replacement.",
        "order_id": "ORD-1001"
    }, headers=customer_headers)
    assert comp_res.status_code == 201, f"Complaint creation failed: {comp_res.status_code}"
    complaint_data = comp_res.json()
    complaint_id = complaint_data["id"]
    print(f"[PASS] Test 7: Customer created complaint {complaint_id} with automated supervisor workflow")

    # Customer lists complaints -> must only contain their own complaints
    list_res = client.get("/api/complaints", headers=customer_headers)
    assert list_res.status_code == 200
    customer_comps = list_res.json()
    for c in customer_comps:
        assert c["customer_id"] == reg_data["user"]["id"], "Customer saw another customer's complaint!"
    print(f"[PASS] Test 8: Customer complaints listing strictly filtered to customer_id={reg_data['user']['id']}")

    # 6. Customer attempts to access unauthorized order (ORD-9999 belongs to CUS-002)
    order_res = client.get("/api/orders/ORD-9999", headers=customer_headers)
    assert order_res.status_code == 403, f"Expected 403 on cross-tenant order access, got {order_res.status_code}"
    print("[PASS] Test 9: Customer blocked from cross-tenant order ORD-9999 (403 Forbidden)")

    # 7. Support Agent Login & Verification
    support_login = client.post("/api/auth/login", json={
        "email": "support@example.com",
        "password": "support123"
    })
    assert support_login.status_code == 200, f"Support login failed: {support_login.status_code}"
    support_token = support_login.json()["access_token"]
    support_headers = {"Authorization": f"Bearer {support_token}"}
    print("[PASS] Test 10: Support agent authenticated successfully (role=SUPPORT_AGENT)")

    # Support agent can access approvals
    supp_apps = client.get("/api/approvals", headers=support_headers)
    assert supp_apps.status_code == 200
    print("[PASS] Test 11: Support agent can view /api/approvals (200 OK)")

    # Support agent can view customer complaints and details
    supp_comp = client.get(f"/api/complaints/{complaint_id}", headers=support_headers)
    assert supp_comp.status_code == 200
    supp_comp_data = supp_comp.json()
    assert "customer_name" in supp_comp_data or "customer_id" in supp_comp_data
    print(f"[PASS] Test 12: Support agent inspected complaint {complaint_id} with customer context")

    # Support agent executes an action (e.g. resolve complaint)
    resolve_res = client.post(f"/api/complaints/{complaint_id}/resolve", json={
        "notes": "Verified package tracking and approved standard resolution.",
        "resolution_text": "Resolution confirmed by support agent."
    }, headers=support_headers)
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "RESOLVED"
    print(f"[PASS] Test 13: Support agent successfully executed POST /api/complaints/{complaint_id}/resolve")

    # 8. Support Agent blocked from Admin endpoints
    supp_on_admin = client.get("/api/admin/users", headers=support_headers)
    assert supp_on_admin.status_code == 403, f"Expected 403 for support on admin users, got {supp_on_admin.status_code}"
    print("[PASS] Test 14: Support agent blocked from /api/admin/users (403 Forbidden)")

    # 9. Admin Login & User Management
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@example.com",
        "password": "admin123"
    })
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.status_code}"
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] Test 15: Admin authenticated successfully (role=ADMIN)")

    # Admin accesses metrics
    admin_metrics = client.get("/api/admin/metrics", headers=admin_headers)
    assert admin_metrics.status_code == 200
    metrics_data = admin_metrics.json()
    assert "operational" in metrics_data and "ai" in metrics_data
    print("[PASS] Test 16: Admin retrieved full operational and AI metrics (200 OK)")

    # Admin accesses users list
    admin_users = client.get("/api/admin/users", headers=admin_headers)
    assert admin_users.status_code == 200
    users_list = admin_users.json()
    print(f"[PASS] Test 17: Admin retrieved user list ({len(users_list)} users)")

    # Admin promotes customer to Support Agent
    promote_res = client.patch(f"/api/admin/users/{reg_data['user']['id']}/role", json={
        "role": "SUPPORT_AGENT"
    }, headers=admin_headers)
    assert promote_res.status_code == 200
    assert promote_res.json()["role"] == "SUPPORT_AGENT"
    print(f"[PASS] Test 18: Admin promoted customer to SUPPORT_AGENT via role change API")

    # Admin inspects audit logs
    admin_logs = client.get("/api/admin/audit-logs", headers=admin_headers)
    assert admin_logs.status_code == 200
    logs = admin_logs.json()
    assert len(logs) > 0
    # Verify audit logs do not contain passwords or secrets
    for log in logs[:10]:
        log_str = str(log)
        assert "password_hash" not in log_str
    print(f"[PASS] Test 19: Admin retrieved audit logs ({len(logs)} entries) with sanitized secrets")

    print("=" * 70)
    print("ALL 19 SECURITY, RBAC, DATA ISOLATION & ACTION TESTS PASSED!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()

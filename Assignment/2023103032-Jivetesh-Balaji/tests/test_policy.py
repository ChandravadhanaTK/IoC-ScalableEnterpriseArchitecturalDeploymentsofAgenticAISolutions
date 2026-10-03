from app.policy import authorize

def test_employee_can_create_ticket():
    assert authorize("U1001", "EMPLOYEE", "create_ticket")["allowed"]

def test_employee_cannot_view_any_asset():
    assert not authorize("U1001", "EMPLOYEE", "view_any_asset")["allowed"]

def test_admin_password_reset_requires_approval():
    result = authorize("U1001", "ADMIN", "reset_password")
    assert result["allowed"]
    assert result["approval_required"]

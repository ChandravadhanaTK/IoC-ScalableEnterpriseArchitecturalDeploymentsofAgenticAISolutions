import importlib.util
from pathlib import Path

MODULE = Path(__file__).parents[1] / "backend" / "app" / "main.py"
spec = importlib.util.spec_from_file_location("aegisdesk_main", MODULE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

def test_planner_routes_wifi_and_vpn():
    assert mod.plan("Wi-Fi keeps disconnecting")[0:2] == ("network_wifi", "check_wifi")
    assert mod.plan("Corporate VPN fails")[0:2] == ("network_vpn", "check_vpn")

def test_sensitive_actions_are_gated():
    category, action, _ = mod.plan("Please unlock my account")
    assert category == "account_access"
    assert action == "protected_action"

def test_retrieval_finds_wifi_article():
    evidence = mod.retrieve("My Wi-Fi internet is intermittent")
    assert evidence
    assert any("wifi" in x["id"].lower() for x in evidence)

def test_simulated_tools_are_explicitly_mocked():
    result = mod.simulated_tool("create_ticket")
    assert result["status"] == "created"
    assert result["ticket_id"].startswith("DEMO-")
    assert "simulated" in result["details"]

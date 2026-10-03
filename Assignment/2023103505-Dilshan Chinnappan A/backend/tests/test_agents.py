import pytest
from app.agents.extractor import run_extractor_agent, defang_indicator
from app.agents.enricher import run_enricher_agent
from app.agents.correlator import run_correlator_agent
from app.agents.remediator import run_remediator_agent
from app.models.state import IOCRecord

def test_defang_indicator():
    assert defang_indicator("http://evil-site.org/payload.exe") == "hxxp://evil-site[.]org/payload[.]exe"
    assert defang_indicator("198.51.100.44") == "198[.]51[.]100[.]44"

@pytest.mark.asyncio
async def test_extractor_agent():
    alert = "Inbound connection from 185.220.101.5 targeting domain malicious-payload-drop.org with CVE-2024-38077"
    iocs, step = await run_extractor_agent(alert)
    
    types = [i.ioc_type for i in iocs]
    values = [i.normalized_value for i in iocs]
    
    assert "ipv4" in types
    assert "185.220.101.5" in values
    assert "domain" in types
    assert "malicious-payload-drop.org" in values
    assert "cve" in types
    assert "CVE-2024-38077" in values
    assert step.agent_name == "IOC Extractor & Normalizer"
    assert step.status == "completed"

@pytest.mark.asyncio
async def test_enricher_agent():
    sample_ioc = IOCRecord(
        id="test-1",
        ioc_type="ipv4",
        raw_value="185.220.101.5",
        normalized_value="185.220.101.5",
        defanged_value="185[.]220[.]101[.]5"
    )
    enriched, peak_risk, step = await run_enricher_agent([sample_ioc])
    
    assert len(enriched) == 1
    assert enriched[0].reputation_score > 50
    assert enriched[0].verdict == "MALICIOUS"
    assert peak_risk > 50
    assert step.status == "completed"

@pytest.mark.asyncio
async def test_remediator_agent_hitl_gating():
    sample_ioc = IOCRecord(
        id="test-1",
        ioc_type="ipv4",
        raw_value="185.220.101.5",
        normalized_value="185.220.101.5",
        defanged_value="185[.]220[.]101[.]5",
        reputation_score=85,
        verdict="MALICIOUS"
    )
    from app.models.state import InternalCorrelation
    correlation = InternalCorrelation(
        matched_internal_asset="SRV-04-PAYROLL",
        asset_ip="10.10.4.12",
        asset_criticality="HIGH",
        blast_radius="HIGH"
    )
    action, step = await run_remediator_agent([sample_ioc], correlation, composite_risk=85)
    
    assert action is not None
    assert action.requires_approval is True
    assert action.status == "PENDING_APPROVAL"
    assert step.status == "awaiting_approval"

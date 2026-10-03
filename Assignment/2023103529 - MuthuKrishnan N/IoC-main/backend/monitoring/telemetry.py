import uuid
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from backend.database.repository import repo
from backend.models.audit import AuditLog
from backend.models.agent_execution import AgentExecution
from backend.security.guardrails import mask_sensitive_data

logger = logging.getLogger("enterprise_ai.telemetry")

class TelemetryManager:
    def log_audit(
        self,
        action: str,
        user_id: Optional[str] = None,
        role: Optional[str] = None,
        complaint_id: Optional[str] = None,
        agent: Optional[str] = None,
        tool: Optional[str] = None,
        result: Optional[str] = None,
        status: str = "SUCCESS",
        approval_required: bool = False,
        approval_status: Optional[str] = None,
        error: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        audit_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"
        clean_metadata = None
        if metadata:
            clean_metadata = {k: mask_sensitive_data(str(v)) if isinstance(v, str) else v for k, v in metadata.items()}

        audit_entry = AuditLog(
            id=audit_id,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            role=role,
            complaint_id=complaint_id,
            agent=agent,
            action=action,
            tool=tool,
            result=result,
            status=status,
            approval_required=approval_required,
            approval_status=approval_status,
            error=mask_sensitive_data(error) if error else None,
            metadata=clean_metadata
        )
        repo.audit_logs.insert_one(audit_entry.model_dump())
        logger.info(f"[AUDIT] [{status}] Action: {action} by {user_id or 'SYSTEM'} (Agent: {agent or 'N/A'})")
        return audit_id

    def log_agent_execution(
        self,
        complaint_id: str,
        agent_name: str,
        started_at: datetime,
        completed_at: datetime,
        status: str = "SUCCESS",
        error: Optional[str] = None,
        input_tokens: int = 0,
        output_tokens: int = 0,
        tool_calls: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        exec_id = f"EXE-{uuid.uuid4().hex[:8].upper()}"
        duration_ms = (completed_at - started_at).total_seconds() * 1000.0

        execution = AgentExecution(
            id=exec_id,
            complaint_id=complaint_id,
            agent_name=agent_name,
            started_at=started_at,
            completed_at=completed_at,
            status=status,
            duration_ms=round(duration_ms, 2),
            error=mask_sensitive_data(error) if error else None,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            tool_calls=tool_calls or [],
            metadata=metadata
        )
        repo.agent_executions.insert_one(execution.model_dump())
        logger.info(f"[TELEMETRY] Agent {agent_name} executed in {duration_ms:.1f}ms (Status: {status})")
        return exec_id

telemetry = TelemetryManager()

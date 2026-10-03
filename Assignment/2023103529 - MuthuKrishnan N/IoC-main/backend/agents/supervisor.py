import logging
from datetime import datetime
from typing import Dict, Any, Optional
from backend.database.repository import repo
from backend.models.user import UserInDB
from backend.models.complaint import ComplaintStatus, AIAnalysis, ResolutionPlan, ActionResult
from backend.tools.support_tools import update_complaint_status
from backend.agents.intent_agent import intent_agent
from backend.agents.order_agent import order_agent
from backend.agents.policy_agent import policy_agent
from backend.agents.resolution_agent import resolution_agent
from backend.agents.action_agent import action_agent
from backend.monitoring.telemetry import telemetry

logger = logging.getLogger("enterprise_ai.agents.supervisor")

class SupervisorAgent:
    """Master Orchestrator controlling the end-to-end agentic workflow,
    managing state transitions, fault handling, and approval gates."""

    async def process_complaint(self, complaint_id: str, user: UserInDB) -> Dict[str, Any]:
        complaint = repo.complaints.find_one({"id": complaint_id})
        if not complaint:
            return {"success": False, "error": f"Complaint {complaint_id} not found"}

        start_time = datetime.utcnow()
        title = complaint.get("title", "")
        description = complaint.get("description", "")
        explicit_order_id = complaint.get("order_id")

        try:
            # Step 1: Intent Classification
            update_complaint_status(
                complaint_id=complaint_id,
                status=ComplaintStatus.CLASSIFYING,
                message="Intent Classification Agent evaluating customer inquiry...",
                user=user
            )
            intent_result = await intent_agent.execute(
                complaint_id=complaint_id,
                title=title,
                description=description,
                explicit_order_id=explicit_order_id
            )

            # Check prompt injection guardrail
            if intent_result.security_flag:
                update_complaint_status(
                    complaint_id=complaint_id,
                    status=ComplaintStatus.FLAGGED_SAFETY,
                    message=f"Quarantined by Security Guardrail: {intent_result.security_flag}",
                    user=user
                )
                repo.complaints.update_one(
                    {"id": complaint_id},
                    {
                        "status": ComplaintStatus.FLAGGED_SAFETY.value,
                        "priority": "CRITICAL",
                        "resolution": "Flagged for security review due to adversarial instructions in complaint text."
                    }
                )
                return {"success": False, "status": ComplaintStatus.FLAGGED_SAFETY.value, "reason": intent_result.security_flag}

            order_id = intent_result.order_id or explicit_order_id
            category = intent_result.category
            intent = intent_result.intent
            priority = intent_result.priority

            # Update category and priority in database
            repo.complaints.update_one(
                {"id": complaint_id},
                {"category": category, "priority": priority, "order_id": order_id}
            )

            # Step 2: Order Information Inspection (if order_id is present)
            order_data = None
            if order_id:
                update_complaint_status(
                    complaint_id=complaint_id,
                    status=ComplaintStatus.FETCHING_ORDER,
                    message=f"Order Agent querying logistics tool for {order_id}...",
                    user=user
                )
                order_result = await order_agent.execute(
                    complaint_id=complaint_id,
                    order_id=order_id,
                    user=user
                )

                if order_result.is_unauthorized:
                    update_complaint_status(
                        complaint_id=complaint_id,
                        status=ComplaintStatus.ESCALATED,
                        message=f"Access Denied: Customer unauthorized to view order {order_id}",
                        user=user
                    )
                    repo.complaints.update_one(
                        {"id": complaint_id},
                        {"resolution": "Halted: Unauthorized cross-tenant order query detected."}
                    )
                    return {"success": False, "status": ComplaintStatus.ESCALATED.value, "reason": "Unauthorized order access"}

                if order_result.success:
                    order_data = order_result.order

            # Step 3: Policy Retrieval via RAG
            update_complaint_status(
                complaint_id=complaint_id,
                status=ComplaintStatus.RETRIEVING_POLICY,
                message="Policy RAG Agent searching company knowledge base in ChromaDB...",
                user=user
            )
            policy_result = await policy_agent.execute(
                complaint_id=complaint_id,
                category=category,
                intent=intent,
                complaint_text=f"{title}. {description}"
            )

            # Step 4: Resolution Reasoning & HITL Assessment
            update_complaint_status(
                complaint_id=complaint_id,
                status=ComplaintStatus.ANALYZING,
                message="Resolution Agent synthesizing evidence and evaluating policy rules...",
                user=user
            )
            resolution_result = await resolution_agent.execute(
                complaint_id=complaint_id,
                complaint_text=f"{title}. {description}",
                category=category,
                intent=intent,
                order=order_data,
                policy_chunks=policy_result.chunks,
                missing_order=(not order_id and category in ["REFUND", "REPLACEMENT", "DAMAGED_PRODUCT", "ORDER_STATUS"])
            )

            # Persist AI Analysis snapshot + resolution_plan + retrieved_policies
            ai_analysis = AIAnalysis(
                detected_category=category,
                customer_intent=intent,
                priority=priority,
                extracted_order_id=order_id,
                policy_citations=policy_result.chunks,
                proposed_resolution=resolution_result.resolution,
                reason=resolution_result.reason,
                requires_approval=resolution_result.requires_approval,
                confidence=resolution_result.confidence,
                risk_assessment=resolution_result.risk_assessment,
                executed_action=None
            )
            resolution_plan = ResolutionPlan(
                resolution=resolution_result.resolution,
                reason=resolution_result.reason,
                requires_approval=resolution_result.requires_approval,
                confidence=resolution_result.confidence,
                risk_assessment=resolution_result.risk_assessment,
            )
            repo.complaints.update_one(
                {"id": complaint_id},
                {
                    "ai_analysis": ai_analysis.model_dump(),
                    "resolution_plan": resolution_plan.model_dump(),
                    "retrieved_policies": policy_result.chunks,
                }
            )

            # Step 5: Approval Gate Check
            if resolution_result.requires_approval:
                # High risk / sensitive: hold for Human Review
                # Tool create_refund_request will enqueue approval record
                action_result = await action_agent.execute_resolution(
                    complaint_id=complaint_id,
                    resolution=resolution_result.resolution,
                    reason=resolution_result.reason,
                    action_payload=resolution_result.action_payload,
                    user=user,
                    is_human_approved=False
                )
                update_complaint_status(
                    complaint_id=complaint_id,
                    status=ComplaintStatus.AWAITING_APPROVAL,
                    message=f"Action held in governance queue for Support Agent sign-off: {resolution_result.reason}",
                    user=user,
                    metadata={"approval_id": action_result.reference_id}
                )
                repo.complaints.update_one(
                    {"id": complaint_id},
                    {"resolution": f"Pending Human Approval: {resolution_result.reason}"}
                )
                return {
                    "success": True,
                    "status": ComplaintStatus.AWAITING_APPROVAL.value,
                    "resolution": resolution_result.resolution,
                    "requires_approval": True,
                    "approval_id": action_result.reference_id
                }

            # Step 6: Automated Action Execution
            update_complaint_status(
                complaint_id=complaint_id,
                status=ComplaintStatus.EXECUTING_ACTION,
                message=f"Action Agent executing authorized resolution: {resolution_result.resolution}...",
                user=user
            )
            action_result = await action_agent.execute_resolution(
                complaint_id=complaint_id,
                resolution=resolution_result.resolution,
                reason=resolution_result.reason,
                action_payload=resolution_result.action_payload,
                user=user,
                is_human_approved=False
            )

            # Finalize Status
            final_status = ComplaintStatus.RESOLVED if action_result.success else ComplaintStatus.FAILED
            update_complaint_status(
                complaint_id=complaint_id,
                status=final_status,
                message=f"Workflow completed: {action_result.message}",
                user=user,
                metadata={"action": action_result.action, "reference_id": action_result.reference_id}
            )

            # Update final complaint resolution description and executed action
            ai_analysis.executed_action = action_result.model_dump()
            final_action_result = ActionResult(
                success=action_result.success,
                action=action_result.action,
                message=action_result.message,
                reference_id=action_result.reference_id,
            )
            repo.complaints.update_one(
                {"id": complaint_id},
                {
                    "resolution": action_result.message,
                    "ai_analysis": ai_analysis.model_dump(),
                    "action_result": final_action_result.model_dump(),
                }
            )

            completed_time = datetime.utcnow()
            telemetry.log_agent_execution(
                complaint_id=complaint_id,
                agent_name="SupervisorAgent",
                started_at=start_time,
                completed_at=completed_time,
                status="SUCCESS",
                metadata={"final_status": final_status.value}
            )

            return {
                "success": True,
                "status": final_status.value,
                "resolution": resolution_result.resolution,
                "action": action_result.action,
                "reference_id": action_result.reference_id,
                "message": action_result.message
            }

        except Exception as exc:
            logger.error(f"SupervisorAgent exception processing {complaint_id}: {exc}", exc_info=True)
            update_complaint_status(
                complaint_id=complaint_id,
                status=ComplaintStatus.ESCALATED,
                message=f"Encountered unexpected workflow exception. Escalated to Human Support: {str(exc)}",
                user=user
            )
            repo.complaints.update_one(
                {"id": complaint_id},
                {"resolution": f"Escalated to human support due to automated processing exception: {str(exc)}"}
            )
            return {"success": False, "status": ComplaintStatus.ESCALATED.value, "error": str(exc)}

    async def resume_after_human_review(
        self,
        complaint_id: str,
        approval_id: str,
        is_approved: bool,
        reviewer_user: UserInDB,
        review_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Resumes workflow execution after Support Agent reviews an approval request."""
        complaint = repo.complaints.find_one({"id": complaint_id})
        approval = repo.approvals.find_one({"id": approval_id})

        if not complaint or not approval:
            return {"success": False, "error": "Complaint or Approval record not found"}

        if not is_approved:
            # Reviewer rejected action
            update_complaint_status(
                complaint_id=complaint_id,
                status=ComplaintStatus.ESCALATED,
                message=f"Support Agent {reviewer_user.name} rejected recommendation: {review_notes or 'Declined by reviewer'}",
                user=reviewer_user
            )
            repo.complaints.update_one(
                {"id": complaint_id},
                {"resolution": f"Rejected by Support Reviewer: {review_notes or 'Does not meet policy exceptions'}"}
            )
            return {
                "success": True,
                "status": ComplaintStatus.ESCALATED.value,
                "message": "Action rejected and escalated to Tier-2 supervisor."
            }

        # Reviewer approved action: Execute with authorization
        update_complaint_status(
            complaint_id=complaint_id,
            status=ComplaintStatus.EXECUTING_ACTION,
            message=f"Human approval granted by {reviewer_user.name}. Executing authorized action...",
            user=reviewer_user
        )

        order_data = repo.orders.find_one({"order_id": complaint.get("order_id")}) or {}
        action_payload = {
            "order_id": complaint.get("order_id"),
            "product": order_data.get("product", "Product"),
            "amount": approval.get("amount") or order_data.get("amount", 0.0),
            "status": order_data.get("status", "DELIVERED")
        }

        # Execute resolution
        req_action = approval.get("requested_action", "")
        resolution_type = "AUTO_REFUND" if "REFUND" in req_action else "AUTO_REPLACEMENT"

        action_result = await action_agent.execute_resolution(
            complaint_id=complaint_id,
            resolution=resolution_type,
            reason=approval.get("reason", "Approved by human support agent."),
            action_payload=action_payload,
            user=reviewer_user,
            is_human_approved=True
        )

        update_complaint_status(
            complaint_id=complaint_id,
            status=ComplaintStatus.RESOLVED,
            message=f"Human-approved action executed: {action_result.message}",
            user=reviewer_user,
            metadata={"reference_id": action_result.reference_id}
        )

        repo.complaints.update_one(
            {"id": complaint_id},
            {"resolution": f"[Human Approved by {reviewer_user.name}] {action_result.message}"}
        )

        return {
            "success": True,
            "status": ComplaintStatus.RESOLVED.value,
            "message": action_result.message,
            "reference_id": action_result.reference_id
        }

supervisor_agent = SupervisorAgent()

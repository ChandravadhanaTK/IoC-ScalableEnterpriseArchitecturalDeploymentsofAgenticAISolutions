from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.agents.orchestrator import AgentOrchestrator
from backend.models.models import AIAnalysis, AuditLog, MaintenanceTeam, Notification, Ticket, User
from backend.services.audit import AuditService
from backend.services.notification import NotificationService


class TicketService:
    @staticmethod
    def create_ticket(db: Session, user: User, payload: dict[str, Any]) -> Ticket:
        ticket = Ticket(
            title=payload["title"],
            description=payload["description"],
            location=payload["location"],
            building=payload["building"],
            room_number=payload["room_number"],
            image_url=payload.get("image_url", ""),
            contact_info=payload.get("contact_info", user.email),
            reporter_id=user.id,
            status="OPEN",
            priority="Medium",
            category="Other",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)

        analysis = AgentOrchestrator().process_ticket(ticket, db)
        ticket.category = analysis["category"]
        ticket.priority = analysis["priority"]
        ticket.ai_reasoning = analysis["reasoning"]
        ticket.suggested_resolution = analysis["resolution_suggestion"]
        ticket.confidence = str(analysis["confidence"])
        ticket.assigned_team_id = analysis["team_id"]
        ticket.assignment_status = "PENDING"
        ticket.human_approval_required = analysis["priority"] in {"High", "Critical"}
        ticket.status = "WAITING_FOR_APPROVAL" if ticket.human_approval_required else "ASSIGNED"
        ticket.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(ticket)

        NotificationService.create_notification(
            db,
            user_id=user.id,
            title="Ticket created",
            message=f"Your ticket '{ticket.title}' has been submitted. Status: {ticket.status}.",
            ticket_id=ticket.id,
        )

        AuditService.log_action(db, "ticket_created", f"Ticket {ticket.id} created", user_id=user.id, ticket_id=ticket.id)
        return ticket

    @staticmethod
    def get_ticket(db: Session, ticket_id: int) -> Ticket:
        ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
        return ticket

    @staticmethod
    def get_user_tickets(db: Session, user: User):
        return db.query(Ticket).filter(Ticket.reporter_id == user.id).order_by(Ticket.created_at.desc()).all()

    @staticmethod
    def get_all_tickets(db: Session):
        return db.query(Ticket).order_by(Ticket.created_at.desc()).all()

    @staticmethod
    def get_assigned_tickets(db: Session, user: User):
        return db.query(Ticket).filter(Ticket.assigned_to_id == user.id).order_by(Ticket.created_at.desc()).all()

    @staticmethod
    def run_ai_analysis(db: Session, ticket: Ticket) -> AIAnalysis:
        analysis = AgentOrchestrator().process_ticket(ticket, db)
        ticket.category = analysis["category"]
        ticket.priority = analysis["priority"]
        ticket.ai_reasoning = analysis["reasoning"]
        ticket.suggested_resolution = analysis["resolution_suggestion"]
        ticket.confidence = str(analysis["confidence"])
        ticket.assigned_team_id = analysis["team_id"]
        ticket.assignment_status = "PENDING"
        ticket.human_approval_required = analysis["priority"] in {"High", "Critical"}
        ticket.status = "WAITING_FOR_APPROVAL" if ticket.human_approval_required else "ASSIGNED"
        ticket.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(ticket)

        ai_record = AIAnalysis(
            ticket_id=ticket.id,
            category=analysis["category"],
            priority=analysis["priority"],
            assignment=analysis["team_name"],
            reasoning=analysis["reasoning"],
            resolution_suggestion=analysis["resolution_suggestion"],
            confidence=str(analysis["confidence"]),
            analysis_source=analysis["analysis_source"],
            analysis_metadata={"team_id": analysis["team_id"]},
        )
        db.add(ai_record)
        db.commit()
        db.refresh(ai_record)
        return ai_record

    @staticmethod
    def approve_ticket(db: Session, ticket: Ticket, user: User):
        if ticket.status != "WAITING_FOR_APPROVAL":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ticket is not awaiting approval")
        ticket.status = "ASSIGNED"
        ticket.assignment_status = "APPROVED"
        ticket.updated_at = datetime.utcnow()
        db.commit()
        NotificationService.create_notification(
            db,
            user_id=ticket.reporter_id,
            title="Ticket approved",
            message=f"Your ticket '{ticket.title}' was approved by the admin.",
            ticket_id=ticket.id,
        )
        AuditService.log_action(db, "ticket_approved", "Ticket approved", user_id=user.id, ticket_id=ticket.id)
        return ticket

    @staticmethod
    def reject_ticket(db: Session, ticket: Ticket, user: User):
        if ticket.status != "WAITING_FOR_APPROVAL":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ticket is not awaiting approval")
        ticket.status = "REJECTED"
        ticket.assignment_status = "REJECTED"
        ticket.updated_at = datetime.utcnow()
        db.commit()
        NotificationService.create_notification(
            db,
            user_id=ticket.reporter_id,
            title="Ticket rejected",
            message=f"Your ticket '{ticket.title}' was rejected by the admin.",
            ticket_id=ticket.id,
        )
        AuditService.log_action(db, "ticket_rejected", "Ticket rejected", user_id=user.id, ticket_id=ticket.id)
        return ticket

    @staticmethod
    def assign_ticket(db: Session, ticket: Ticket, team_id: int):
        team = db.query(MaintenanceTeam).filter(MaintenanceTeam.id == team_id).first()
        if not team:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Maintenance team not found")
        ticket.assigned_team_id = team.id
        ticket.assignment_status = "ASSIGNED"
        ticket.status = "ASSIGNED" if ticket.status in {"OPEN", "WAITING_FOR_APPROVAL"} else ticket.status
        ticket.updated_at = datetime.utcnow()
        db.commit()
        return ticket

    @staticmethod
    def start_work(db: Session, ticket: Ticket, user: User):
        if ticket.status == "RESOLVED":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ticket already resolved")
        ticket.assigned_to_id = user.id
        ticket.status = "IN_PROGRESS"
        ticket.updated_at = datetime.utcnow()
        db.commit()
        return ticket

    @staticmethod
    def resolve_ticket(db: Session, ticket: Ticket, user: User):
        ticket.status = "RESOLVED"
        ticket.resolved_at = datetime.utcnow()
        ticket.updated_at = datetime.utcnow()
        ticket.assigned_to_id = user.id
        db.commit()
        NotificationService.create_notification(
            db,
            user_id=ticket.reporter_id,
            title="Ticket resolved",
            message=f"Your ticket '{ticket.title}' has been resolved.",
            ticket_id=ticket.id,
        )
        AuditService.log_action(db, "ticket_resolved", "Ticket resolved", user_id=user.id, ticket_id=ticket.id)
        return ticket

    @staticmethod
    def add_resolution_notes(db: Session, ticket: Ticket, notes: str):
        ticket.resolution_notes = notes
        ticket.updated_at = datetime.utcnow()
        db.commit()
        return ticket

    @staticmethod
    def get_ticket_history(db: Session, ticket_id: int):
        logs = db.query(AuditLog).filter(AuditLog.ticket_id == ticket_id).order_by(AuditLog.timestamp.asc()).all()
        return logs

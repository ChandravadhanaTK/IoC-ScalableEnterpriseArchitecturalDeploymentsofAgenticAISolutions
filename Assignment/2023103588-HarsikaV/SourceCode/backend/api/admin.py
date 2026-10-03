from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from backend.models.models import MaintenanceTeam, Ticket, User
from backend.services.analytics import AnalyticsService
from backend.services.audit import AuditService
from backend.services.auth import get_current_user, get_db, require_roles
from backend.services.notification import NotificationService
from backend.services.ticket import TicketService

router = APIRouter(prefix="/api/admin", tags=["admin"])


class TeamCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    category: str
    description: str = ""


@router.get("/tickets")
def get_all_tickets(current_user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    tickets = TicketService.get_all_tickets(db)
    return [serialize_ticket(ticket) for ticket in tickets]


@router.get("/approvals")
def approvals(current_user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    tickets = db.query(Ticket).filter(Ticket.status == "WAITING_FOR_APPROVAL").order_by(Ticket.created_at.desc()).all()
    return [serialize_ticket(ticket) for ticket in tickets]


@router.post("/tickets/{ticket_id}/approve")
def approve_ticket(ticket_id: int, current_user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    ticket = TicketService.get_ticket(db, ticket_id)
    updated = TicketService.approve_ticket(db, ticket, current_user)
    NotificationService.create_notification(
        db,
        user_id=ticket.reporter_id,
        title="Admin approval",
        message=f"Your ticket '{ticket.title}' was approved.",
        ticket_id=ticket.id,
    )
    return serialize_ticket(updated)


@router.post("/tickets/{ticket_id}/reject")
def reject_ticket(ticket_id: int, current_user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    ticket = TicketService.get_ticket(db, ticket_id)
    updated = TicketService.reject_ticket(db, ticket, current_user)
    return serialize_ticket(updated)


@router.get("/teams")
def get_teams(current_user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    teams = db.query(MaintenanceTeam).all()
    return [{"id": team.id, "name": team.name, "category": team.category, "description": team.description} for team in teams]


@router.post("/teams")
def create_team(payload: TeamCreateRequest, current_user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    team = MaintenanceTeam(name=payload.name, category=payload.category, description=payload.description)
    db.add(team)
    db.commit()
    db.refresh(team)
    return {"id": team.id, "name": team.name, "category": team.category}


@router.get("/audit")
def get_audit(current_user: User = Depends(require_roles("admin")), db: Session = Depends(get_db)):
    logs = db.query(Ticket).all()
    return {"message": "Audit log endpoint is available", "count": 0}


def serialize_ticket(ticket: Ticket) -> dict:
    return {
        "id": ticket.id,
        "title": ticket.title,
        "description": ticket.description,
        "location": ticket.location,
        "building": ticket.building,
        "room_number": ticket.room_number,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "reporter_id": ticket.reporter_id,
        "assigned_team_id": ticket.assigned_team_id,
        "assigned_to_id": ticket.assigned_to_id,
        "ai_reasoning": ticket.ai_reasoning,
        "suggested_resolution": ticket.suggested_resolution,
        "resolution_notes": ticket.resolution_notes,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
    }

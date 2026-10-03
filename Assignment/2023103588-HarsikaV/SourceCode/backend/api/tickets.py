from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from backend.database.config import SessionLocal
from backend.models.models import AuditLog, Ticket, User
from backend.services.audit import AuditService
from backend.services.auth import get_current_user, get_db, require_roles
from backend.services.ticket import TicketService

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


class TicketCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=10)
    location: str
    building: str
    room_number: str
    image_url: str | None = None
    contact_info: str | None = None


@router.post("", status_code=status.HTTP_201_CREATED)
def create_ticket(payload: TicketCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = TicketService.create_ticket(db, current_user, payload.model_dump())
    return {
        "id": ticket.id,
        "title": ticket.title,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "assigned_team_id": ticket.assigned_team_id,
        "ai_reasoning": ticket.ai_reasoning,
        "suggested_resolution": ticket.suggested_resolution,
        "confidence": ticket.confidence,
    }


@router.get("/my")
def get_my_tickets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tickets = TicketService.get_user_tickets(db, current_user)
    return [serialize_ticket(ticket) for ticket in tickets]


@router.get("/{ticket_id}")
def get_ticket(ticket_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = TicketService.get_ticket(db, ticket_id)
    if ticket.reporter_id != current_user.id and current_user.role not in {"admin", "staff", "maintenance"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    return serialize_ticket(ticket)


@router.post("/{ticket_id}/analysis")
def run_ai_analysis(ticket_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = TicketService.get_ticket(db, ticket_id)
    if ticket.reporter_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    ai_record = TicketService.run_ai_analysis(db, ticket)
    return {
        "ticket_id": ticket.id,
        "category": ai_record.category,
        "priority": ai_record.priority,
        "assignment": ai_record.assignment,
        "reasoning": ai_record.reasoning,
        "resolution_suggestion": ai_record.resolution_suggestion,
        "confidence": ai_record.confidence,
        "analysis_source": ai_record.analysis_source,
    }


@router.post("/{ticket_id}/assign")
def assign_ticket(ticket_id: int, team_id: int, current_user: User = Depends(require_roles("admin", "staff")), db: Session = Depends(get_db)):
    ticket = TicketService.get_ticket(db, ticket_id)
    updated = TicketService.assign_ticket(db, ticket, team_id)
    AuditService.log_action(db, "ticket_assignment", f"Ticket assigned to team {team_id}", user_id=current_user.id, ticket_id=ticket.id)
    return serialize_ticket(updated)


@router.post("/{ticket_id}/start")
def start_work(ticket_id: int, current_user: User = Depends(require_roles("maintenance")), db: Session = Depends(get_db)):
    ticket = TicketService.get_ticket(db, ticket_id)
    if current_user.id != ticket.assigned_to_id and current_user.role != "maintenance":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ticket is not assigned to this maintenance user")
    updated = TicketService.start_work(db, ticket, current_user)
    return serialize_ticket(updated)


@router.post("/{ticket_id}/resolve")
def resolve_ticket(ticket_id: int, payload: dict, current_user: User = Depends(require_roles("maintenance")), db: Session = Depends(get_db)):
    ticket = TicketService.get_ticket(db, ticket_id)
    updated = TicketService.resolve_ticket(db, ticket, current_user)
    if payload.get("notes"):
        TicketService.add_resolution_notes(db, updated, payload["notes"])
    return serialize_ticket(updated)


@router.post("/{ticket_id}/notes")
def add_resolution_notes(ticket_id: int, payload: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = TicketService.get_ticket(db, ticket_id)
    if current_user.role not in {"maintenance", "admin"} and ticket.reporter_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    updated = TicketService.add_resolution_notes(db, ticket, payload.get("notes", ""))
    return serialize_ticket(updated)


@router.get("/{ticket_id}/history")
def get_history(ticket_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = TicketService.get_ticket(db, ticket_id)
    if ticket.reporter_id != current_user.id and current_user.role not in {"admin", "maintenance"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    history = TicketService.get_ticket_history(db, ticket_id)
    return [{"id": entry.id, "action": entry.action, "details": entry.details, "timestamp": entry.timestamp.isoformat()} for entry in history]


def serialize_ticket(ticket: Ticket) -> dict:
    return {
        "id": ticket.id,
        "title": ticket.title,
        "description": ticket.description,
        "location": ticket.location,
        "building": ticket.building,
        "room_number": ticket.room_number,
        "image_url": ticket.image_url,
        "contact_info": ticket.contact_info,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "assignment_status": ticket.assignment_status,
        "reporter_id": ticket.reporter_id,
        "assigned_team_id": ticket.assigned_team_id,
        "assigned_to_id": ticket.assigned_to_id,
        "ai_reasoning": ticket.ai_reasoning,
        "suggested_resolution": ticket.suggested_resolution,
        "resolution_notes": ticket.resolution_notes,
        "confidence": ticket.confidence,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
        "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
    }

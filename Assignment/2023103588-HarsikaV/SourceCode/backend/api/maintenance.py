from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.models.models import Ticket, User
from backend.services.audit import AuditService
from backend.services.auth import get_current_user, get_db, require_roles
from backend.services.ticket import TicketService

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


@router.get("/tickets")
def assigned_tickets(current_user: User = Depends(require_roles("maintenance")), db: Session = Depends(get_db)):
    tickets = db.query(Ticket).filter(Ticket.assigned_to_id == current_user.id).order_by(Ticket.created_at.desc()).all()
    return [serialize_ticket(ticket) for ticket in tickets]


@router.post("/tickets/{ticket_id}/accept")
def accept_ticket(ticket_id: int, current_user: User = Depends(require_roles("maintenance")), db: Session = Depends(get_db)):
    ticket = TicketService.get_ticket(db, ticket_id)
    ticket.assigned_to_id = current_user.id
    ticket.status = "IN_PROGRESS"
    ticket.updated_at = ticket.updated_at
    db.commit()
    AuditService.log_action(db, "ticket_accepted", "Ticket accepted by maintenance", user_id=current_user.id, ticket_id=ticket.id)
    return serialize_ticket(ticket)


@router.post("/tickets/{ticket_id}/start")
def start_ticket(ticket_id: int, current_user: User = Depends(require_roles("maintenance")), db: Session = Depends(get_db)):
    ticket = TicketService.get_ticket(db, ticket_id)
    if ticket.assigned_to_id not in {None, current_user.id}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ticket not assigned to this maintenance user")
    ticket.status = "IN_PROGRESS"
    ticket.assigned_to_id = current_user.id
    db.commit()
    return serialize_ticket(ticket)


@router.post("/tickets/{ticket_id}/resolve")
def resolve_ticket(ticket_id: int, payload: dict, current_user: User = Depends(require_roles("maintenance")), db: Session = Depends(get_db)):
    ticket = TicketService.get_ticket(db, ticket_id)
    updated = TicketService.resolve_ticket(db, ticket, current_user)
    if payload.get("notes"):
        TicketService.add_resolution_notes(db, updated, payload["notes"])
    return serialize_ticket(updated)


@router.post("/tickets/{ticket_id}/notes")
def add_notes(ticket_id: int, payload: dict, current_user: User = Depends(require_roles("maintenance")), db: Session = Depends(get_db)):
    ticket = TicketService.get_ticket(db, ticket_id)
    updated = TicketService.add_resolution_notes(db, ticket, payload.get("notes", ""))
    return serialize_ticket(updated)


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
        "suggested_resolution": ticket.suggested_resolution,
        "resolution_notes": ticket.resolution_notes,
        "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
    }

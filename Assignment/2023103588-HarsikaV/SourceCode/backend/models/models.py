from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from backend.database.config import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), default="student", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    tickets = relationship("Ticket", back_populates="reporter", foreign_keys="Ticket.reporter_id")
    assigned_tickets = relationship("Ticket", back_populates="assignee", foreign_keys="Ticket.assigned_to_id")
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")


class MaintenanceTeam(Base):
    __tablename__ = "maintenance_teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    tickets = relationship("Ticket", back_populates="team")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(150), nullable=False)
    building = Column(String(150), nullable=False)
    room_number = Column(String(100), nullable=False)
    image_url = Column(String(300), default="")
    contact_info = Column(String(200), default="")
    category = Column(String(50), default="Other")
    priority = Column(String(30), default="Medium")
    status = Column(String(30), default="OPEN")
    assignment_status = Column(String(30), default="PENDING")
    human_approval_required = Column(Boolean, default=False)
    ai_reasoning = Column(Text, default="")
    resolution_notes = Column(Text, default="")
    suggested_resolution = Column(Text, default="")
    confidence = Column(String(20), default="0.70")
    assigned_team_id = Column(Integer, ForeignKey("maintenance_teams.id"), nullable=True)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    team = relationship("MaintenanceTeam", back_populates="tickets")
    reporter = relationship("User", back_populates="tickets", foreign_keys=[reporter_id])
    assignee = relationship("User", back_populates="assigned_tickets", foreign_keys=[assigned_to_id])
    analyses = relationship("AIAnalysis", back_populates="ticket", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="ticket")
    audit_logs = relationship("AuditLog", back_populates="ticket")


class AIAnalysis(Base):
    __tablename__ = "ai_analysis"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    category = Column(String(50), nullable=False)
    priority = Column(String(30), nullable=False)
    assignment = Column(String(100), nullable=True)
    reasoning = Column(Text, nullable=False)
    resolution_suggestion = Column(Text, nullable=False)
    confidence = Column(String(20), default="0.70")
    analysis_source = Column(String(30), default="rule_based")
    analysis_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    ticket = relationship("Ticket", back_populates="analyses")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
    ticket = relationship("Ticket", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, default="")
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")
    ticket = relationship("Ticket", back_populates="audit_logs")

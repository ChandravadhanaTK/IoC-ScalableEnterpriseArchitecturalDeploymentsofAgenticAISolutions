import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean,
    DateTime, ForeignKey, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship
from app.db.session import Base


def now_utc():
    return datetime.now(timezone.utc)


def new_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=new_id)
    name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum("student", "admin", name="user_role"), default="student", nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    memory_items = relationship("MemoryItem", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(String, primary_key=True, default=new_id)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    category = Column(String(50), default="general")
    status = Column(
        SAEnum("pending", "active", "paused", "completed", name="goal_status"),
        default="active",
    )
    progress = Column(Float, default=0.0)
    target_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="goals")
    milestones = relationship("Milestone", back_populates="goal", cascade="all, delete-orphan", order_by="Milestone.order_index")
    agent_states = relationship("AgentState", back_populates="goal", cascade="all, delete-orphan")


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(String, primary_key=True, default=new_id)
    goal_id = Column(String, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    order_index = Column(Integer, default=0)
    status = Column(
        SAEnum("pending", "in_progress", "completed", name="milestone_status"),
        default="pending",
    )
    created_at = Column(DateTime(timezone=True), default=now_utc)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    goal = relationship("Goal", back_populates="milestones")
    tasks = relationship("Task", back_populates="milestone", cascade="all, delete-orphan", order_by="Task.order_index")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=new_id)
    milestone_id = Column(String, ForeignKey("milestones.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    order_index = Column(Integer, default=0)
    status = Column(
        SAEnum("pending", "in_progress", "completed", "skipped", name="task_status"),
        default="pending",
    )
    difficulty = Column(SAEnum("easy", "medium", "hard", name="task_difficulty"), default="medium")
    estimated_minutes = Column(Integer, default=30)
    depends_on = Column(JSON, default=list)  # list of task IDs
    created_at = Column(DateTime(timezone=True), default=now_utc)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    milestone = relationship("Milestone", back_populates="tasks")


class AgentState(Base):
    __tablename__ = "agent_states"

    id = Column(String, primary_key=True, default=new_id)
    goal_id = Column(String, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    state = Column(String(50), default="idle")  # idle, analyzing, planning, selecting, waiting, observing, replanning
    current_task_id = Column(String, ForeignKey("tasks.id"), nullable=True)
    plan_data = Column(JSON, default=dict)
    context = Column(JSON, default=dict)
    iteration = Column(Integer, default=0)
    last_action = Column(String(100), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)

    goal = relationship("Goal", back_populates="agent_states")
    current_task = relationship("Task", foreign_keys=[current_task_id])


class AgentEvent(Base):
    __tablename__ = "agent_events"

    id = Column(String, primary_key=True, default=new_id)
    goal_id = Column(String, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(100), nullable=False)
    data = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=now_utc)


class MemoryItem(Base):
    __tablename__ = "memory_items"

    id = Column(String, primary_key=True, default=new_id)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    memory_type = Column(String(50), default="general")  # learning_style, strength, weakness, preference
    content = Column(Text, nullable=False)
    confidence = Column(Float, default=0.8)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    user = relationship("User", back_populates="memory_items")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=new_id)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=True)
    resource_id = Column(String, nullable=True)
    details = Column(JSON, default=dict)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=now_utc)

    user = relationship("User", back_populates="audit_logs")

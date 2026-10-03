from datetime import datetime

from sqlalchemy.orm import Session

from backend.database.config import SessionLocal
from backend.services.auth import get_password_hash


def seed_demo_data() -> None:
    from backend.models.models import AuditLog, MaintenanceTeam, Notification, Ticket, User

    db: Session = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            db.add(
                User(
                    username="admin",
                    email="admin@campusfix.ai",
                    full_name="System Admin",
                    password_hash=get_password_hash("Admin123!"),
                    role="admin",
                )
            )

        if not db.query(User).filter(User.username == "maintenance").first():
            db.add(
                User(
                    username="maintenance",
                    email="maintenance@campusfix.ai",
                    full_name="Maintenance Officer",
                    password_hash=get_password_hash("Maintenance123!"),
                    role="maintenance",
                )
            )

        if not db.query(User).filter(User.username == "staff").first():
            db.add(
                User(
                    username="staff",
                    email="staff@campusfix.ai",
                    full_name="Campus Staff",
                    password_hash=get_password_hash("Staff123!"),
                    role="staff",
                )
            )

        if not db.query(User).filter(User.username == "student").first():
            db.add(
                User(
                    username="student",
                    email="student@campusfix.ai",
                    full_name="Demo Student",
                    password_hash=get_password_hash("Student123!"),
                    role="student",
                )
            )

        if not db.query(MaintenanceTeam).filter(MaintenanceTeam.name == "IT Support").first():
            db.add_all(
                [
                    MaintenanceTeam(name="IT Support", category="Network", description="Network infrastructure and device support"),
                    MaintenanceTeam(name="Electrical Team", category="Electrical", description="Power and electrical safety work"),
                    MaintenanceTeam(name="Plumbing Team", category="Plumbing", description="Water and drainage issues"),
                    MaintenanceTeam(name="Housekeeping", category="Cleaning", description="Cleaning and sanitation support"),
                    MaintenanceTeam(name="Technical Support", category="Equipment", description="Projectors, AV, and equipment repair"),
                    MaintenanceTeam(name="Civil Maintenance", category="Infrastructure", description="Buildings, doors, windows, and structures"),
                ]
            )

        student_user = db.query(User).filter(User.username == "student").first()
        if student_user and not db.query(Ticket).first():
            team = db.query(MaintenanceTeam).filter(MaintenanceTeam.name == "IT Support").first()
            sample_ticket = Ticket(
                title="Wi-Fi outage in CS Lab 3",
                description="Wi-Fi is not working in CS Lab 3 and students cannot connect.",
                location="CS Department",
                building="Computer Science Block",
                room_number="Lab 3",
                contact_info=student_user.email,
                category="Network",
                priority="Medium",
                status="OPEN",
                reporter_id=student_user.id,
                assigned_team_id=team.id if team else None,
                ai_reasoning="Detected network-related keywords and moderate user impact.",
                resolution_notes="Check access points and reboot the lab router.",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(sample_ticket)

        if not db.query(Notification).first():
            welcome_user = db.query(User).filter(User.username == "student").first()
            if welcome_user:
                db.add(Notification(user_id=welcome_user.id, ticket_id=None, title="Welcome", message="Your CampusFix AI account is ready.", is_read=False))

        if not db.query(AuditLog).first():
            admin_user = db.query(User).filter(User.username == "admin").first()
            if admin_user:
                db.add(AuditLog(user_id=admin_user.id, action="system_boot", details="Seed data loaded", ticket_id=None))

        db.commit()
    finally:
        db.close()

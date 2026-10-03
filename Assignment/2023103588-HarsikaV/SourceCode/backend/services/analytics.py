from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.models.models import AIAnalysis, Ticket, User


class AnalyticsService:
    @staticmethod
    def get_summary(db: Session):
        total_tickets = db.query(Ticket).count()
        open_tickets = db.query(Ticket).filter(Ticket.status != "RESOLVED").count()
        high_priority = db.query(Ticket).filter(Ticket.priority.in_(["High", "Critical"])).count()
        critical_tickets = db.query(Ticket).filter(Ticket.priority == "Critical").count()
        resolved_tickets = db.query(Ticket).filter(Ticket.status == "RESOLVED").count()
        avg_resolution = db.query(func.avg(func.julianday(Ticket.resolved_at) - func.julianday(Ticket.created_at))).scalar() or 0

        by_category = (
            db.query(Ticket.category, func.count(Ticket.id).label("count"))
            .group_by(Ticket.category)
            .all()
        )
        by_priority = (
            db.query(Ticket.priority, func.count(Ticket.id).label("count"))
            .group_by(Ticket.priority)
            .all()
        )
        by_status = (
            db.query(Ticket.status, func.count(Ticket.id).label("count"))
            .group_by(Ticket.status)
            .all()
        )
        ai_success = db.query(AIAnalysis).count()
        total_analysis = max(1, ai_success)

        return {
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "high_priority_tickets": high_priority,
            "critical_tickets": critical_tickets,
            "resolved_tickets": resolved_tickets,
            "average_resolution_time_days": round(float(avg_resolution) or 0, 2),
            "ai_analysis_success_rate": round((ai_success / total_analysis) * 100, 2),
            "tickets_by_category": [{"name": category, "count": count} for category, count in by_category],
            "tickets_by_priority": [{"name": priority, "count": count} for priority, count in by_priority],
            "tickets_by_status": [{"name": status, "count": count} for status, count in by_status],
            "total_users": db.query(User).count(),
            "generated_at": datetime.utcnow().isoformat(),
        }

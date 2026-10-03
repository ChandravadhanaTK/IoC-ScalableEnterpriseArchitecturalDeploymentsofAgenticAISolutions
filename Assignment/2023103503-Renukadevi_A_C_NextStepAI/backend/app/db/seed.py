"""
Seed the database with initial demo data for development.
Run: python -m app.db.seed
"""
from app.db.session import engine, SessionLocal, Base
from app.db import models
from app.core.security import hash_password
import uuid


def create_tables():
    Base.metadata.create_all(bind=engine)


def seed():
    create_tables()
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(models.User).count() > 0:
            print("Database already seeded. Skipping.")
            return

        # Create admin user
        admin = models.User(
            id=str(uuid.uuid4()),
            name="Admin User",
            email="admin@nextstep.ai",
            hashed_password=hash_password("admin123"),
            role="admin",
        )
        db.add(admin)

        # Create student user
        student = models.User(
            id=str(uuid.uuid4()),
            name="Alex Chen",
            email="alex@student.com",
            hashed_password=hash_password("student123"),
            role="student",
        )
        db.add(student)
        db.flush()

        # Create a sample goal for the student
        goal = models.Goal(
            id=str(uuid.uuid4()),
            user_id=student.id,
            title="Build a MERN Expense Tracker",
            description="A full-stack expense tracking app using MongoDB, Express, React, and Node.js",
            category="project",
            status="active",
            progress=0.0,
        )
        db.add(goal)
        db.flush()

        # Create milestones
        milestone_data = [
            ("Setup & Foundation", [
                ("Initialize Node.js backend with Express", 30, "easy"),
                ("Setup MongoDB connection with Mongoose", 20, "easy"),
                ("Create basic folder structure (MVC pattern)", 15, "easy"),
            ]),
            ("Backend API", [
                ("Design User schema with name, email, password fields", 20, "medium"),
                ("Implement JWT authentication (register/login)", 45, "medium"),
                ("Create Expense model with amount, category, date, description", 20, "medium"),
                ("Build CRUD REST API for expenses", 60, "medium"),
                ("Add input validation with express-validator", 30, "medium"),
            ]),
            ("Frontend", [
                ("Initialize React app with Vite", 15, "easy"),
                ("Setup React Router for navigation", 20, "easy"),
                ("Build Login and Signup forms", 45, "medium"),
                ("Create Dashboard with expense list", 60, "hard"),
                ("Add expense creation and editing forms", 45, "medium"),
                ("Implement charts with Chart.js for spending overview", 60, "hard"),
            ]),
            ("Integration & Deployment", [
                ("Connect frontend to backend API with Axios", 30, "medium"),
                ("Handle auth token storage and refresh", 30, "hard"),
                ("Test all flows end-to-end", 60, "medium"),
                ("Deploy backend to Render.com", 45, "medium"),
                ("Deploy frontend to Vercel", 30, "easy"),
            ]),
        ]

        for mi_idx, (mi_title, tasks) in enumerate(milestone_data):
            milestone = models.Milestone(
                id=str(uuid.uuid4()),
                goal_id=goal.id,
                title=mi_title,
                order_index=mi_idx,
                status="pending",
            )
            db.add(milestone)
            db.flush()

            for t_idx, (t_title, t_mins, t_diff) in enumerate(tasks):
                task = models.Task(
                    id=str(uuid.uuid4()),
                    milestone_id=milestone.id,
                    title=t_title,
                    order_index=t_idx,
                    estimated_minutes=t_mins,
                    difficulty=t_diff,
                    status="pending",
                )
                db.add(task)

        # Mark first task in progress and set initial AgentState
        first_milestone = db.query(models.Milestone).filter(models.Milestone.goal_id == goal.id).order_by(models.Milestone.order_index).first()
        if first_milestone:
            first_task = db.query(models.Task).filter(models.Task.milestone_id == first_milestone.id).order_by(models.Task.order_index).first()
            if first_task:
                first_task.status = "in_progress"
                agent_state = models.AgentState(
                    id=str(uuid.uuid4()),
                    goal_id=goal.id,
                    current_task_id=first_task.id,
                    state="waiting_for_student",
                    iteration=1,
                )
                db.add(agent_state)

        # Add memory items for the student
        memories = [
            ("learning_style", "Prefers hands-on project-based learning over theory", 0.9),
            ("strength", "Good at JavaScript fundamentals and async/await patterns", 0.85),
            ("preference", "Likes to see working code examples before abstract explanations", 0.8),
        ]
        for m_type, m_content, m_conf in memories:
            mem = models.MemoryItem(
                id=str(uuid.uuid4()),
                user_id=student.id,
                memory_type=m_type,
                content=m_content,
                confidence=m_conf,
            )
            db.add(mem)

        db.commit()
        print("[OK] Database seeded successfully!")
        print("   Admin: admin@nextstep.ai / admin123")
        print("   Student: alex@student.com / student123")

    except Exception as e:
        db.rollback()
        print(f"[FAIL] Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

import sys
import os
from pathlib import Path
from datetime import datetime, timedelta

# Ensure UTF-8 output on Windows console
if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.database.repository import repo
from backend.models.user import UserInDB, Role
from backend.models.order import Order
from backend.security.auth import get_password_hash
from backend.rag.ingestion import ingest_all_policies
from backend.monitoring.telemetry import telemetry

def seed():
    print("[INFO] Seeding Enterprise AI Database...")

    # Normalize any legacy role records
    all_users = repo.users.find({})
    for u in all_users:
        current_r = str(u.get("role", "")).upper()
        if current_r in ["ADMIN", "ADMINISTRATOR"]:
            norm = Role.ADMIN.value
        elif current_r in ["SUPPORT", "SUPPORT_AGENT", "AGENT"]:
            norm = Role.SUPPORT_AGENT.value
        else:
            norm = Role.CUSTOMER.value
        if u.get("role") != norm:
            repo.users.update_one({"id": u["id"]}, {"role": norm})

    # 1. Seed Users (idempotent: only if not already present)
    users_data = [
        {
            "id": "CUS-001",
            "name": "Rahul Sharma",
            "email": "customer@example.com",
            "role": Role.CUSTOMER,
            "password": "customer123"
        },
        {
            "id": "SUP-001",
            "name": "Ananya Patel",
            "email": "support@example.com",
            "role": Role.SUPPORT_AGENT,
            "password": "support123"
        },
        {
            "id": "ADM-001",
            "name": "Enterprise Admin",
            "email": "admin@example.com",
            "role": Role.ADMIN,
            "password": "admin123"
        }
    ]

    for u in users_data:
        existing = repo.users.find_one({"email": u["email"]})
        if not existing:
            pwd_hash = get_password_hash(u["password"])
            user_db = UserInDB(
                id=u["id"],
                name=u["name"],
                email=u["email"],
                role=u["role"],
                password_hash=pwd_hash,
                created_at=datetime.utcnow() - timedelta(days=30)
            )
            repo.users.insert_one(user_db.model_dump())
            print(f"  [USER] Seeded: {u['email']} [{u['role'].value}]")
        else:
            print(f"  [USER] Exists: {u['email']}")

    # 2. Seed Orders (idempotent)
    orders_data = [
        {
            "id": "ORD-1001",
            "order_id": "ORD-1001",
            "customer_id": "CUS-001",
            "product": "Laptop Stand (Aluminum Ergonomic)",
            "amount": 2499.00,
            "status": "DELIVERED",
            "delivery_date": "2026-09-28"
        },
        {
            "id": "ORD-1002",
            "order_id": "ORD-1002",
            "customer_id": "CUS-001",
            "product": "Mechanical Ergonomic Keyboard (High Value)",
            "amount": 25000.00,
            "status": "DELIVERED",
            "delivery_date": "2026-09-25"
        },
        {
            "id": "ORD-1003",
            "order_id": "ORD-1003",
            "customer_id": "CUS-001",
            "product": "Ultra-Wide Gaming Monitor 34-inch",
            "amount": 42000.00,
            "status": "DELIVERED",
            "delivery_date": "2026-09-29"
        },
        {
            "id": "ORD-1004",
            "order_id": "ORD-1004",
            "customer_id": "CUS-001",
            "product": "USB-C Multi-Port Hub (8-in-1)",
            "amount": 1850.00,
            "status": "DELIVERED",
            "delivery_date": "2026-09-27"
        },
        {
            "id": "ORD-1005",
            "order_id": "ORD-1005",
            "customer_id": "CUS-001",
            "product": "Noise-Canceling Wireless Headphones",
            "amount": 7499.00,
            "status": "IN_TRANSIT",
            "delivery_date": "Estimated: Tomorrow 4:00 PM"
        },
        # Tenant boundary test order: belongs to CUS-002
        {
            "id": "ORD-9999",
            "order_id": "ORD-9999",
            "customer_id": "CUS-002",
            "product": "Private Server Rack Enclosure (Confidential)",
            "amount": 85000.00,
            "status": "DELIVERED",
            "delivery_date": "2026-09-20"
        }
    ]

    for o in orders_data:
        existing_order = repo.orders.find_one({"id": o["id"]})
        if not existing_order:
            order_model = Order(**o)
            repo.orders.insert_one(order_model.model_dump())
            print(f"  [ORDER] Seeded: {o['order_id']} - INR {o['amount']} ({o['status']})")
        else:
            print(f"  [ORDER] Exists: {o['order_id']}")

    # 3. Ingest Policy Documents
    print("[INFO] Ingesting policy documents into Vector Store...")
    chunks_count = ingest_all_policies()
    print(f"  [RAG] Ingested {chunks_count} policy clauses into ChromaDB / In-Memory store.")

    # 4. Initial Baseline Audit Events
    telemetry.log_audit(
        action="SYSTEM_INITIALIZATION",
        user_id="SYSTEM",
        role="ADMIN",
        status="SUCCESS",
        result="Enterprise AI Support Platform initialized with baseline seed data."
    )

    print("[SUCCESS] Database and RAG seeding completed successfully!\n")

if __name__ == "__main__":
    seed()

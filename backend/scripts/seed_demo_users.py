import sys
import os

# Ensure backend root is on sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import SessionLocal, engine, Base
from app.models import User
from app.auth import get_password_hash

# Distinct, secure demo passwords per role
DEMO_USERS = [
    {
        "officer_id": "IR-OFFICER-ENG01",
        "password": "EngTrack#2026!Pass",
        "role": "FIELD_OFFICER_ENG",
        "full_name": "Rajesh Kumar (Track Engineering)",
        "department": "ENGINEERING"
    },
    {
        "officer_id": "IR-OFFICER-ST01",
        "password": "Signal#2026!Secured",
        "role": "FIELD_OFFICER_ST",
        "full_name": "Priya Sharma (Signal & Telecom)",
        "department": "SIGNAL_TELECOM"
    },
    {
        "officer_id": "IR-OFFICER-TRD01",
        "password": "Traction#2026!Power",
        "role": "FIELD_OFFICER_TRD",
        "full_name": "Amitabh Roy (Traction OHE)",
        "department": "TRACTION_DISTRIBUTION"
    },
    {
        "officer_id": "IR-OFFICER-CTRL01",
        "password": "CtrlOffice#2026!Master",
        "role": "OPERATIONS_CONTROLLER",
        "full_name": "Vikramaditya Singh (Central Control)",
        "department": None
    },
    {
        "officer_id": "IR-OFFICER-DRM01",
        "password": "DivEng#2026!Approve",
        "role": "DIVISIONAL_ENGINEER",
        "full_name": "Dr. S. K. Mukherjee (Sr. DEN / DRM)",
        "department": None
    },
    {
        "officer_id": "IR-OFFICER-SSE01",
        "password": "SseGround#2026!Safety",
        "role": "SSE_INSPECTOR",
        "full_name": "R. K. Verma (Senior Section Engineer - Ground)",
        "department": "ENGINEERING"
    },
    {
        "officer_id": "IR-OFFICER-DOM01",
        "password": "DomTraffic#2026!Clear",
        "role": "DOM_OPERATIONS",
        "full_name": "A. P. Deshmukh (Divisional Operations Manager)",
        "department": "OPERATIONS"
    }
]

def seed_users():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    updated_count = 0

    try:
        for user_data in DEMO_USERS:
            hashed_pw = get_password_hash(user_data["password"])
            existing = db.query(User).filter(User.officer_id == user_data["officer_id"]).first()
            if existing:
                existing.hashed_password = hashed_pw
                existing.full_name = user_data["full_name"]
                existing.department = user_data["department"]
                existing.role = user_data["role"]
                existing.is_active = True
                updated_count += 1
            else:
                new_user = User(
                    officer_id=user_data["officer_id"],
                    hashed_password=hashed_pw,
                    role=user_data["role"],
                    full_name=user_data["full_name"],
                    department=user_data["department"],
                    is_active=True
                )
                db.add(new_user)
                updated_count += 1

        db.commit()
        print(f"Seed update completed: {updated_count} user accounts configured with distinct passwords.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()

"""
clear_test_data.py
------------------
Clears all synthetic / test data from:
  - block_schedule
  - maintenance_tasks

Run once to reset the DB to a clean state before a real demo.
"""
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    r1 = db.execute(text("DELETE FROM block_schedule"))
    r2 = db.execute(text("DELETE FROM maintenance_tasks"))
    db.commit()

    print(f"[OK] Deleted {r1.rowcount} block_schedule records")
    print(f"[OK] Deleted {r2.rowcount} maintenance_task records")
    print("[DONE] Database is clean and ready for demo.")
except Exception as e:
    db.rollback()
    print(f"[ERROR] {e}")
    sys.exit(1)
finally:
    db.close()

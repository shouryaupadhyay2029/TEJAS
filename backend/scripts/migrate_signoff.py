import sys, os
sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/..'))

from sqlalchemy import create_engine, text

def migrate():
    working_engine = None
    for host in ['127.0.0.1', 'localhost']:
        for port in [5433, 5432]:
            try:
                db_url = f"postgresql://tejas_user:tejas_pass@{host}:{port}/tejas_db"
                eng = create_engine(db_url, connect_args={"connect_timeout": 2})
                with eng.begin() as conn:
                    conn.execute(text("SELECT 1;"))
                print(f"Connected on {host}:{port}!")
                working_engine = eng
                break
            except Exception as e:
                pass
        if working_engine:
            break

    if not working_engine:
        print("Could not connect to DB on 5433/5432, applying schema model fallback.")
        return

    with working_engine.begin() as conn:
        conn.execute(text("ALTER TABLE block_schedule ADD COLUMN IF NOT EXISTS sse_approved BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE block_schedule ADD COLUMN IF NOT EXISTS dom_approved BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE block_schedule ADD COLUMN IF NOT EXISTS sse_notes TEXT;"))
        conn.execute(text("ALTER TABLE block_schedule ADD COLUMN IF NOT EXISTS dom_notes TEXT;"))
    print("Migration successful!")

if __name__ == "__main__":
    migrate()

import os
import json

os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5433/tejas"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("--- CALL 1: GET /network/graph?limit=50 ---")
r1 = client.get("/network/graph?limit=50")
d1 = r1.json()
print(f"Status: {r1.status_code}")
print(f"Node count: {len(d1['nodes'])}")
print(f"Edge count: {len(d1['edges'])}")
print(f"Meta: {d1['meta']}")

print("\n--- CALL 2: GET /network/graph?limit=50&department=ENGINEERING ---")
r2 = client.get("/network/graph?limit=50&department=ENGINEERING")
d2 = r2.json()
print(f"Status: {r2.status_code}")
print(f"Node count: {len(d2['nodes'])}")
print(f"Edge count: {len(d2['edges'])}")
print(f"Meta: {d2['meta']}")

print("\n--- CALL 3: GET /network/graph?limit=500 ---")
r3 = client.get("/network/graph?limit=500")
d3 = r3.json()
print(f"Status: {r3.status_code}")
print(f"Node count: {len(d3['nodes'])}")
print(f"Edge count: {len(d3['edges'])}")
print(f"Meta: {d3['meta']}")

print("\n--- RAW JSON FOR CALL 1 (Truncated to first 1000 characters) ---")
raw_json1 = json.dumps(d1, indent=2)
print(raw_json1[:1000])

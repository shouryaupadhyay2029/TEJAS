import os
import sys
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler

# 1. Spin up a lightweight local mock ML API server on port 8001
class MockMLHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        print(f"  [Mock ML Server] Received POST payload: {body.decode('utf-8')}")
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        # Return ML urgency score of 78.50 (scale 0-100)
        response_data = b'{"task_id": "503", "urgency_score": 78.50}'
        self.wfile.write(response_data)
        
    def log_message(self, format, *args):
        pass

mock_server = HTTPServer(('localhost', 8001), MockMLHandler)
server_thread = threading.Thread(target=mock_server.serve_forever, daemon=True)
server_thread.start()

# Set environment variables for FastAPI backend
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5433/tejas"
os.environ["ML_API_URL"] = "http://localhost:8001"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

payload = {
    "section_id": 1862,
    "defect_type": "Feeder/circuit breaker fault",
    "defect_severity": "HIGH",
    "officer_notes": "test report with live ML score",
    "inspection_datetime": "2026-09-03T10:00:00",
    "days_since_detected": 3
}

print("\n--- TEST: Posting incident report with active ML API server ---")
response = client.post("/maintenance-tasks/report", json=payload)
print(f"HTTP Status: {response.status_code}")
print("Response JSON:")
import json
print(json.dumps(response.json(), indent=2))

mock_server.shutdown()

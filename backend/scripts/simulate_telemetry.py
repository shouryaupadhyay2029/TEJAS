"""
TEJAS Live Telemetry & Defect Broadcasting Simulation Script.
Simulates ML scoring events and broadcasts emergency defect payloads to the FastAPI WebSocket server.
"""

import time
import requests
import json

API_URL = "http://localhost:8000/broadcast/telemetry"

SAMPLE_DEFECTS = [
    {
        "event_type": "DEFECT_REPORTED",
        "id": "EMG-109",
        "title": "USFD Rail Flaw & Weld Fracture",
        "message": "Severe 4.8mm rail fracture detected under dynamic freight load.",
        "type": "EMERGENCY",
        "department": "ENGINEERING",
        "subsystem": "P.Way (USFD Rail Inspection)",
        "urgencyScore": 96.7,
        "sectionCode": "VAR-LKO-SEC1",
        "routeLocation": "Varanasi - Lucknow Mainline (KM 42.4, Track T1)",
        "reportedExactTime": "12 Sep 2026, 00:45:00 IST",
        "detailedObservations": "USFD waveform registered 4.8mm transverse crack at thermit weld joint #214.",
        "recommendedAction": "Impose 20 km/h emergency speed restriction (PSR). Dispatch SSE/P.Way immediately."
    },
    {
        "event_type": "DEFECT_REPORTED",
        "id": "EMG-110",
        "title": "Point Machine 114A Contact Spike",
        "message": "Point switch detection contacts failing to lock under route setting.",
        "type": "EMERGENCY",
        "department": "S&T",
        "subsystem": "Signalling & Interlocking",
        "urgencyScore": 92.4,
        "sectionCode": "NDLS-YARD-SOUTH",
        "routeLocation": "New Delhi Central Yard South Interlocking",
        "reportedExactTime": "12 Sep 2026, 01:10:00 IST",
        "detailedObservations": "Microswitch resistance exceeded threshold (>180 ohms). Point machine 114A end-lock fault.",
        "recommendedAction": "Lock Signal 12B to Red. Deploy S&T ESM for manual crank inspection."
    },
    {
        "event_type": "DEFECT_REPORTED",
        "id": "EMG-111",
        "title": "OHE Catenary Wire Dropper Snap",
        "message": "Pantograph impact sensor detected sudden catenary tension drop.",
        "type": "EMERGENCY",
        "department": "TRACTION",
        "subsystem": "Overhead Equipment (OHE)",
        "urgencyScore": 91.2,
        "sectionCode": "CNB-PRYJ-SEC3",
        "routeLocation": "Kanpur - Prayagraj Section (KM 112.6, UP Line)",
        "reportedExactTime": "12 Sep 2026, 01:30:00 IST",
        "detailedObservations": "Dropper wire #14 snapped at Mast #112/8. High risk of pantograph entanglement.",
        "recommendedAction": "De-energize OHE Section 3. Dispatch Electrical Tower Wagon."
    }
]

def run_simulation():
    print("🚀 TEJAS Telemetry & Emergency Defect Broadcaster Starting...")
    print(f"Connecting to FastAPI broadcast target: {API_URL}")

    for idx, defect in enumerate(SAMPLE_DEFECTS, 1):
        print(f"\n[{idx}/{len(SAMPLE_DEFECTS)}] Broadcasting Emergency Alert: {defect['id']} - {defect['title']}")
        try:
            res = requests.post(API_URL, json=defect, timeout=5)
            if res.status_code == 200:
                print(f"✅ Successfully broadcasted to active WebSockets! Server response: {res.json()}")
            else:
                print(f"⚠️ Broadcast returned status {res.status_code}: {res.text}")
        except Exception as e:
            print(f"❌ Failed to reach FastAPI server at {API_URL}: {e}")
        
        time.sleep(4)

if __name__ == "__main__":
    run_simulation()

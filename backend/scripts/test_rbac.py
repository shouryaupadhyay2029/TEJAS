import requests

BASE_URL = 'http://localhost:8000'
USERS = [
    {'officer_id': 'IR-OFFICER-ENG01', 'role': 'FIELD_OFFICER_ENG', 'dept': 'ENGINEERING'},
    {'officer_id': 'IR-OFFICER-ST01', 'role': 'FIELD_OFFICER_ST', 'dept': 'SIGNAL_TELECOM'},
    {'officer_id': 'IR-OFFICER-TRD01', 'role': 'FIELD_OFFICER_TRD', 'dept': 'TRACTION_DISTRIBUTION'},
    {'officer_id': 'IR-OFFICER-CTRL01', 'role': 'OPERATIONS_CONTROLLER', 'dept': None},
    {'officer_id': 'IR-OFFICER-DRM01', 'role': 'DIVISIONAL_ENGINEER', 'dept': None},
]

print('=== 10 ROLE VERIFICATION CHECKS ===\n')

for u in USERS:
    # 1. Login
    res = requests.post(f"{BASE_URL}/auth/login", json={'officer_id': u['officer_id'], 'password': 'Password123!'})
    token = res.json().get('access_token')
    headers = {'Authorization': f"Bearer {token}"}
    
    # 2. Check /auth/me
    me = requests.get(f"{BASE_URL}/auth/me", headers=headers).json()
    assert me['officer_id'] == u['officer_id']
    assert me['role'] == u['role']
    print(f"USER: {u['officer_id']} ({u['role']})")

    # 3. ALLOWED ACTION CHECK
    if u['role'].startswith('FIELD_OFFICER'):
        report_payload = {
            'section_id': 1,
            'defect_type': 'Track Weld Alignment Inspection',
            'department': u['dept'],
            'defect_severity': 'MEDIUM',
            'days_since_detected': 2,
            'officer_notes': 'Field test'
        }
        r_allowed = requests.post(f"{BASE_URL}/maintenance-tasks/report", json=report_payload, headers=headers)
        status = 'PASS' if r_allowed.status_code == 200 else 'FAIL'
        print(f"  Allowed Action (Report Defect in {u['dept']}): Status {r_allowed.status_code} -> {status}")
    elif u['role'] == 'OPERATIONS_CONTROLLER':
        opt_payload = {'horizon': 'WEEKLY', 'max_capacity': 2, 'time_limit_sec': 5, 'dry_run': True}
        r_allowed = requests.post(f"{BASE_URL}/optimizer/run", json=opt_payload, headers=headers)
        status = 'PASS' if r_allowed.status_code == 200 else 'FAIL'
        print(f"  Allowed Action (Run CP-SAT Optimizer): Status {r_allowed.status_code} -> {status}")
    elif u['role'] == 'DIVISIONAL_ENGINEER':
        r_allowed = requests.patch(f"{BASE_URL}/block-schedule/1/approve", headers=headers)
        status = 'PASS' if r_allowed.status_code == 200 else 'FAIL'
        print(f"  Allowed Action (Approve Block Schedule): Status {r_allowed.status_code} -> {status}")

    # 4. DENIED ACTION CHECK
    if u['role'].startswith('FIELD_OFFICER'):
        opt_payload = {'horizon': 'WEEKLY', 'max_capacity': 2, 'time_limit_sec': 5, 'dry_run': True}
        r_denied = requests.post(f"{BASE_URL}/optimizer/run", json=opt_payload, headers=headers)
        status = 'PASS' if r_denied.status_code == 403 else 'FAIL'
        print(f"  Denied Action (Trigger CP-SAT Solver): Status {r_denied.status_code} -> {status}")
    elif u['role'] == 'OPERATIONS_CONTROLLER':
        r_denied = requests.patch(f"{BASE_URL}/block-schedule/1/approve", headers=headers)
        status = 'PASS' if r_denied.status_code == 403 else 'FAIL'
        print(f"  Denied Action (Approve Block Schedule): Status {r_denied.status_code} -> {status}")
    elif u['role'] == 'DIVISIONAL_ENGINEER':
        opt_payload = {'horizon': 'WEEKLY', 'max_capacity': 2, 'time_limit_sec': 5, 'dry_run': True}
        r_denied = requests.post(f"{BASE_URL}/optimizer/run", json=opt_payload, headers=headers)
        status = 'PASS' if r_denied.status_code == 403 else 'FAIL'
        print(f"  Denied Action (Trigger CP-SAT Solver): Status {r_denied.status_code} -> {status}")

    print()

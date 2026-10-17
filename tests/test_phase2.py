import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.seed import seed_database

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    seed_database()

client = TestClient(app)

def test_demo_patient_session():
    """Verify one-tap demo login for seeded patient."""
    resp = client.post("/api/auth/session", json={
        "auth_type": "demo",
        "demo_role": "patient"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "patient"
    assert data["user"]["full_name"] == "Rahul Sharma"
    assert data["user"]["phone"] == "+919876543210"
    assert data["user"]["profile"] is not None
    assert data["user"]["profile"]["blood_group"] == "B+"

def test_demo_doctor_session():
    """Verify one-tap demo login for seeded doctor."""
    resp = client.post("/api/auth/session", json={
        "auth_type": "demo",
        "demo_role": "doctor"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "doctor"
    assert data["user"]["full_name"] == "Dr. Emily Peterson"
    assert data["user"]["doctor_reg_no"] == "KMC-48291"

def test_phone_otp_mock_login():
    """Verify mock OTP rules: 123456 succeeds; wrong OTP fails."""
    # Test incorrect OTP
    bad_resp = client.post("/api/auth/session", json={
        "auth_type": "phone_otp",
        "phone": "+919999988888",
        "otp": "000000"
    })
    assert bad_resp.status_code == 400
    assert "123456" in bad_resp.json()["detail"]

    # Test valid OTP
    good_resp = client.post("/api/auth/session", json={
        "auth_type": "phone_otp",
        "phone": "+919999988888",
        "otp": "123456",
        "preferred_language": "hi"
    })
    assert good_resp.status_code == 200
    data = good_resp.json()
    assert "access_token" in data
    assert data["user"]["phone"] == "+919999988888"
    assert data["user"]["preferred_language"] == "hi"

def test_auth_me_protected_endpoint():
    """Verify GET /api/auth/me requires valid Bearer token."""
    # Unauthenticated
    unauth_resp = client.get("/api/auth/me")
    assert unauth_resp.status_code == 401

    # Invalid token
    bad_token_resp = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.value"})
    assert bad_token_resp.status_code == 401

    # Valid token
    login_resp = client.post("/api/auth/session", json={
        "auth_type": "demo",
        "demo_role": "patient"
    })
    token = login_resp.json()["access_token"]

    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["full_name"] == "Rahul Sharma"
    assert me_data["role"] == "patient"

def test_role_update_endpoint():
    """Verify POST /api/auth/role allows updating user role & license."""
    # Create a fresh phone user
    login_resp = client.post("/api/auth/session", json={
        "auth_type": "phone_otp",
        "phone": "+918888877777",
        "otp": "123456"
    })
    token = login_resp.json()["access_token"]

    # Switch role to doctor
    role_resp = client.post(
        "/api/auth/role",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "role": "doctor",
            "doctor_reg_no": "MED-TEST-9901",
            "full_name": "Dr. Tester"
        }
    )
    assert role_resp.status_code == 200
    updated_data = role_resp.json()
    assert updated_data["user"]["role"] == "doctor"
    assert updated_data["user"]["doctor_reg_no"] == "MED-TEST-9901"
    assert updated_data["user"]["full_name"] == "Dr. Tester"

    # Use the renewed token
    new_token = updated_data["access_token"]
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["role"] == "doctor"

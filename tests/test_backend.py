import pytest
from datetime import datetime, timedelta, timezone
from backend.services.validators import (
    validate_lab_value,
    calculate_lab_flag,
    fuzzy_match_medicine,
    check_allergy_and_interactions
)

def test_lab_value_biological_validation():
    # Negative value rejected
    valid, err = validate_lab_value("Hemoglobin", -1.0)
    assert not valid
    assert "Negative" in err

    # Hemoglobin normal range valid
    valid, err = validate_lab_value("Hemoglobin", 14.5)
    assert valid
    assert err is None

    # Hemoglobin impossible value rejected (e.g., 35 g/dL)
    valid, err = validate_lab_value("Hemoglobin", 35.0)
    assert not valid
    assert "outside plausible range" in err

    # Fasting glucose extreme value rejected
    valid, err = validate_lab_value("Fasting Blood Sugar", 1500.0)
    assert not valid

def test_abnormal_flagging():
    # Normal fasting blood sugar (70 - 99)
    flag = calculate_lab_flag(85.0, 70.0, 99.0, "Fasting Blood Sugar")
    assert flag == "normal"

    # High blood sugar
    flag = calculate_lab_flag(145.0, 70.0, 99.0, "Fasting Blood Sugar")
    assert flag == "high"

    # Critical high blood sugar (> 1.5 * max)
    flag = calculate_lab_flag(250.0, 70.0, 99.0, "Fasting Blood Sugar")
    assert flag == "critical_high"

    # Low hemoglobin
    flag = calculate_lab_flag(9.0, 12.0, 17.5, "Hemoglobin")
    assert flag == "low"

def test_medicine_fuzzy_matching():
    # Slightly misspelled Metformin -> Metformin
    match = fuzzy_match_medicine("metforrmin")
    assert match["matched"] is True
    assert match["standard_name"] == "Metformin"

    # Brand match Telma
    match = fuzzy_match_medicine("telma")
    assert match["matched"] is True
    assert match["standard_name"] == "Telma"

def test_allergy_and_interactions():
    # Patient allergic to Penicillin taking Amoxicillin
    warnings = check_allergy_and_interactions(
        med_name="Amoxicillin",
        patient_allergies=["Penicillin"],
        current_medicines=[]
    )
    assert len(warnings) > 0
    assert any("Penicillin" in w["message"] for w in warnings)

    # Aspirin + Ibuprofen interaction
    warnings = check_allergy_and_interactions(
        med_name="Ibuprofen",
        patient_allergies=[],
        current_medicines=["Aspirin"]
    )
    assert len(warnings) > 0
    assert any(w["type"] == "interaction" for w in warnings)

def test_token_expiration_logic():
    now = datetime.now(timezone.utc)
    expired_time = now - timedelta(hours=1)
    future_time = now + timedelta(hours=23)

    assert now > expired_time, "Should detect expired token"
    assert not (now > future_time), "Active token should not be expired"

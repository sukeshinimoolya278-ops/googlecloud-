import sys
import os
import unittest
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from services.validators import (
    validate_lab_value,
    calculate_lab_flag,
    fuzzy_match_medicine,
    check_allergy_and_interactions
)

class TestHealthVaultCore(unittest.TestCase):
    def test_lab_value_biological_validation(self):
        valid, err = validate_lab_value("Hemoglobin", -1.0)
        self.assertFalse(valid)
        self.assertIn("Negative", err)

        valid, err = validate_lab_value("Hemoglobin", 14.5)
        self.assertTrue(valid)
        self.assertIsNone(err)

        valid, err = validate_lab_value("Hemoglobin", 35.0)
        self.assertFalse(valid)
        self.assertIn("outside plausible range", err)

        valid, err = validate_lab_value("Fasting Blood Sugar", 1500.0)
        self.assertFalse(valid)

    def test_abnormal_flagging(self):
        flag = calculate_lab_flag(85.0, 70.0, 99.0, "Fasting Blood Sugar")
        self.assertEqual(flag, "normal")

        flag = calculate_lab_flag(145.0, 70.0, 99.0, "Fasting Blood Sugar")
        self.assertEqual(flag, "high")

        flag = calculate_lab_flag(250.0, 70.0, 99.0, "Fasting Blood Sugar")
        self.assertEqual(flag, "critical_high")

        flag = calculate_lab_flag(9.0, 12.0, 17.5, "Hemoglobin")
        self.assertEqual(flag, "low")

    def test_medicine_fuzzy_matching(self):
        match = fuzzy_match_medicine("metforrmin")
        self.assertTrue(match["matched"])
        self.assertEqual(match["standard_name"], "Metformin")

        match = fuzzy_match_medicine("telma")
        self.assertTrue(match["matched"])
        self.assertEqual(match["standard_name"], "Telma")

    def test_allergy_and_interactions(self):
        warnings = check_allergy_and_interactions(
            med_name="Amoxicillin",
            patient_allergies=["Penicillin"],
            current_medicines=[]
        )
        self.assertTrue(len(warnings) > 0)
        self.assertTrue(any("Penicillin" in w["message"] for w in warnings))

        warnings = check_allergy_and_interactions(
            med_name="Ibuprofen",
            patient_allergies=[],
            current_medicines=["Aspirin"]
        )
        self.assertTrue(len(warnings) > 0)
        self.assertTrue(any(w["type"] == "interaction" for w in warnings))

    def test_token_expiration_logic(self):
        now = datetime.now(timezone.utc)
        expired_time = now - timedelta(hours=1)
        future_time = now + timedelta(hours=23)

        self.assertTrue(now > expired_time)
        self.assertFalse(now > future_time)

if __name__ == "__main__":
    unittest.main()

import json
import os
import difflib
from typing import Dict, Any, List, Optional, Tuple

DRUGS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "drugs.json")
INTERACTIONS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "interactions.json")

# Load reference drug list
try:
    with open(DRUGS_PATH, "r", encoding="utf-8") as f:
        KNOWN_DRUGS = json.load(f)
        KNOWN_DRUG_NAMES = [d["name"].lower() for d in KNOWN_DRUGS]
except Exception:
    KNOWN_DRUGS = []
    KNOWN_DRUG_NAMES = []

# Load interactions and allergy classes
try:
    with open(INTERACTIONS_PATH, "r", encoding="utf-8") as f:
        INTERACTIONS_DATA = json.load(f)
except Exception:
    INTERACTIONS_DATA = {"allergy_classes": {}, "drug_interactions": []}

# Biologically plausible bounds for common lab tests
PHYSIOLOGICAL_RANGES = {
    "hemoglobin": {"min": 3.0, "max": 25.0, "default_unit": "g/dL", "normal_min": 12.0, "normal_max": 17.5},
    "fasting blood sugar": {"min": 20.0, "max": 1000.0, "default_unit": "mg/dL", "normal_min": 70.0, "normal_max": 99.0},
    "glucose": {"min": 20.0, "max": 1000.0, "default_unit": "mg/dL", "normal_min": 70.0, "normal_max": 140.0},
    "random blood sugar": {"min": 20.0, "max": 1000.0, "default_unit": "mg/dL", "normal_min": 70.0, "normal_max": 140.0},
    "hba1c": {"min": 3.0, "max": 20.0, "default_unit": "%", "normal_min": 4.0, "normal_max": 5.6},
    "total cholesterol": {"min": 40.0, "max": 800.0, "default_unit": "mg/dL", "normal_min": 125.0, "normal_max": 200.0},
    "serum creatinine": {"min": 0.1, "max": 25.0, "default_unit": "mg/dL", "normal_min": 0.6, "normal_max": 1.3},
    "platelet count": {"min": 5000, "max": 2000000, "default_unit": "/mcL", "normal_min": 150000, "normal_max": 450000},
    "wbc": {"min": 500, "max": 100000, "default_unit": "/mcL", "normal_min": 4000, "normal_max": 11000},
    "systolic bp": {"min": 50, "max": 300, "default_unit": "mmHg", "normal_min": 90, "normal_max": 120},
    "diastolic bp": {"min": 30, "max": 200, "default_unit": "mmHg", "normal_min": 60, "normal_max": 80},
}

def validate_lab_value(test_name: str, value: float, unit: Optional[str] = None) -> Tuple[bool, Optional[str]]:
    """
    Validates if a lab test value is biologically possible.
    Rejects negative numbers and impossible physiological outliers.
    """
    if value < 0:
        return False, "Negative values are physiologically invalid"

    name_lower = test_name.lower().strip()
    for ref_key, bounds in PHYSIOLOGICAL_RANGES.items():
        if ref_key in name_lower:
            if value < bounds["min"] or value > bounds["max"]:
                return False, f"Value {value} is outside plausible range ({bounds['min']} - {bounds['max']} {bounds['default_unit']})"
            break

    return True, None

def calculate_lab_flag(value: float, normal_min: Optional[float], normal_max: Optional[float], test_name: str = "") -> str:
    """
    Pure rule-based comparison against normal ranges.
    Returns: 'normal', 'low', 'high', 'critical_low', 'critical_high'
    """
    if normal_min is None or normal_max is None:
        # Fallback to standard biological ranges if missing
        name_lower = test_name.lower().strip()
        for ref_key, bounds in PHYSIOLOGICAL_RANGES.items():
            if ref_key in name_lower:
                normal_min = normal_min or bounds.get("normal_min")
                normal_max = normal_max or bounds.get("normal_max")
                break

    if normal_min is None or normal_max is None:
        return "normal"

    if value < normal_min:
        # Critical low check (e.g. < 50% of min)
        if value < (normal_min * 0.6):
            return "critical_low"
        return "low"
    elif value > normal_max:
        # Critical high check (e.g. > 150% of max)
        if value > (normal_max * 1.5):
            return "critical_high"
        return "high"

    return "normal"

def fuzzy_match_medicine(input_name: str, threshold: float = 0.6) -> Dict[str, Any]:
    """
    Fuzzy-matches medicine name against standard 200+ Indian medicines database.
    Catches handwritten OCR misspellings and provides standard brand/category.
    """
    clean_name = input_name.strip().lower()
    matches = difflib.get_close_matches(clean_name, KNOWN_DRUG_NAMES, n=1, cutoff=threshold)

    if matches:
        matched_str = matches[0]
        # find original object
        for drug in KNOWN_DRUGS:
            if drug["name"].lower() == matched_str:
                return {
                    "matched": True,
                    "standard_name": drug["name"],
                    "category": drug.get("category", "General Medication"),
                    "common_doses": drug.get("common_doses", []),
                    "original_input": input_name
                }

    return {
        "matched": False,
        "standard_name": input_name.strip(),
        "category": "Prescription Drug",
        "common_doses": [],
        "original_input": input_name
    }

def check_allergy_and_interactions(
    med_name: str,
    patient_allergies: List[str],
    current_medicines: List[str]
) -> List[Dict[str, str]]:
    """
    Rule-based check against allergy classes and current medication interactions.
    """
    warnings = []
    med_lower = med_name.lower().strip()

    # 1. Allergy class check
    allergy_classes = INTERACTIONS_DATA.get("allergy_classes", {})
    for allergy in patient_allergies:
        allergy_name = allergy.strip()
        associated_drugs = allergy_classes.get(allergy_name, [])
        for drug in associated_drugs:
            if drug.lower() in med_lower or med_lower in drug.lower():
                warnings.append({
                    "type": "allergy",
                    "severity": "high",
                    "message": f"WARNING: Patient is allergic to {allergy_name}. {med_name} belongs to or contains {drug}!"
                })

    # 2. Drug-drug interactions
    interactions = INTERACTIONS_DATA.get("drug_interactions", [])
    for curr in current_medicines:
        curr_lower = curr.lower().strip()
        for item in interactions:
            drugs = [d.lower() for d in item["drugs"]]
            if any(d in med_lower for d in drugs) and any(d in curr_lower for d in drugs):
                warnings.append({
                    "type": "interaction",
                    "severity": item.get("severity", "medium"),
                    "message": f"Interaction between {med_name} and {curr}: {item['warning']}"
                })

    return warnings

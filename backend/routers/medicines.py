import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from routers.auth import get_current_patient_id
from services.supabase_client import db

router = APIRouter(prefix="/api/medicines", tags=["Medicines Corner"])

@router.get("/")
async def get_patient_medicines(patient_id: str = Depends(get_current_patient_id)):
    """
    Returns active medicines with days left, and past medicines whose course has ended.
    """
    all_meds = db.medicines.get(patient_id, [])
    confirmed_meds = [m for m in all_meds if m.get("confirmed")]

    today = datetime.date.today()
    active_list = []
    past_list = []

    for med in confirmed_meds:
        end_date_str = med.get("end_date")
        days_left = 0
        is_active = True

        if end_date_str:
            try:
                end_date = datetime.date.fromisoformat(end_date_str)
                delta = (end_date - today).days
                if delta < 0:
                    is_active = False
                    days_left = 0
                else:
                    days_left = delta
            except Exception:
                is_active = True
                days_left = 5

        med_copy = dict(med)
        med_copy["days_left"] = days_left

        if is_active:
            active_list.append(med_copy)
        else:
            past_list.append(med_copy)

    return {
        "active_medicines": active_list,
        "past_medicines": past_list
    }

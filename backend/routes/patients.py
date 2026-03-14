from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from db.supabase_client import supabase

router = APIRouter(prefix="/patients", tags=["patients"])

class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str

class SessionCreate(BaseModel):
    patient_id: str
    symptoms: str
    image_url: Optional[str] = None
    diagnosis: dict
    severity: str
    worker_id: str

@router.post("/")
async def create_patient(patient: PatientCreate):
    try:
        response = supabase.table("patients").insert({
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender
        }).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session")
async def create_session(session: SessionCreate):
    try:
        response = supabase.table("sessions").insert({
            "patient_id": session.patient_id,
            "symptoms": session.symptoms,
            "image_url": session.image_url,
            "diagnosis": session.diagnosis,
            "severity": session.severity,
            "worker_id": session.worker_id
        }).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions")
async def get_recent_sessions(limit: int = 10):
    try:
        response = supabase.table("sessions").select("*, patients(name, age)").order("created_at", desc=True).limit(limit).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{user_id}/history")
async def get_patient_history(user_id: str, limit: int = 5):
    try:
        # Fetch up to `limit` past history records for the user
        response = supabase.table("patient_history").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

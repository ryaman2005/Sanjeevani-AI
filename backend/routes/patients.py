from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from db.mongodb_client import get_db

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
        db = get_db()

        result = db.patients.insert_one({
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender
        })

        return {"id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session")
async def create_session(session: SessionCreate):
    try:
        db = get_db()

        result = db.sessions.insert_one({
            "patient_id": session.patient_id,
            "symptoms": session.symptoms,
            "image_url": session.image_url,
            "diagnosis": session.diagnosis,
            "severity": session.severity,
            "worker_id": session.worker_id
        })

        return {"id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}/history")
async def get_patient_history(user_id: str, limit: int = 5):
    try:
        db = get_db()

        history = list(
            db.patient_history.find({"user_id": user_id})
            .sort("created_at", -1)
            .limit(limit)
        )

        for item in history:
            item["_id"] = str(item["_id"])

        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
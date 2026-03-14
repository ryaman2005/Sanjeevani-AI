from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging

from services.symptom_analyzer import analyze_symptoms, SymptomRequest
from services.image_analyzer import analyze_medical_image
from db.mongodb_client import get_db
from datetime import datetime, timezone

router = APIRouter(prefix="/analyze", tags=["analysis"])
logger = logging.getLogger(__name__)

class DiagnosisRequest(BaseModel):
    user_id: str
    symptoms: str
    age: int
    gender: str
    history: list = []

@router.post("/save-diagnosis")
async def save_diagnosis_route(request: DiagnosisRequest):
    # 1. Ask the AI to analyze the symptoms
    symp_req = SymptomRequest(
        symptoms=request.symptoms, 
        age=request.age, 
        gender=request.gender, 
        history=request.history
    )
    
    ai_result = await analyze_symptoms(symp_req)
    
    if "error" in ai_result:
        raise HTTPException(status_code=500, detail=ai_result["error"])

    # 2. Extract Data 
    ai_conditions = ai_result.get("top_conditions", [])
    precautions = ai_result.get("precautions", [])
    
    # Combine explanation and 'what_to_do' array into a single text block
    advice_text = ai_result.get("explanation", "")
    what_to_do = ai_result.get("what_to_do", [])
    if what_to_do:
        advice_text += "\nSteps to take:\n" + "\n".join(what_to_do)

    # 3. Create the row data to insert
    insert_data = {
        "user_id": request.user_id,
        "symptoms": request.symptoms,
        "ai_conditions": ai_conditions, 
        "precautions": precautions,
        "advice": advice_text
    }

    # 4. Insert into MongoDB collection
    try:
        insert_data["created_at"] = datetime.now(timezone.utc)
        db = get_db()
        if db is not None:
            response = db.patient_history.insert_one(insert_data)
        else:
            raise Exception("Database connection not established")
            
    except Exception as e:
        logger.error(f"Failed to insert into patient_history: {e}")
        raise HTTPException(status_code=500, detail="Failed to save history to MongoDB")

    return {
        "status": "success",
        "message": "Diagnosis saved successfully",
        "data": ai_result,
        "record": response.data[0] if response.data else None
    }

@router.post("/symptoms")
async def analyze_symptoms_route(request: SymptomRequest):
    result = await analyze_symptoms(request)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@router.post("/triage")
async def analyze_triage_route(request: SymptomRequest):
    from services.triage_analyzer import generate_triage_questions
    result = await generate_triage_questions(request.symptoms)
    return result

@router.post("/image")
async def analyze_image_route(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    result = await analyze_medical_image(file)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

@router.post("/combined")
async def analyze_combined_route(
    symptoms: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    worker_id: str = Form(default="00000000-0000-0000-0000-000000000000"),
    file: Optional[UploadFile] = File(None)
):
    # 1. Resolve effective user_id
    user_id = worker_id if worker_id and worker_id != "00000000-0000-0000-0000-000000000000" else "11111111-1111-1111-1111-111111111111"

    # 2. Fetch recent history for context
    history_data = []
    try:
        logger.info(f"Fetching history for user {user_id}")
        db = get_db()
        if db is not None:
            # Fetch last 3 records sorted by created_at descending
            cursor = db.patient_history.find({"user_id": user_id}, {"_id": 0, "symptoms": 1, "created_at": 1}).sort("created_at", -1).limit(3)
            history_data = list(cursor)
            # Convert datetime to string if necessary for JSON serialization later, or let it be
            logger.info(f"Loaded {len(history_data)} history records for context.")
        else:
            logger.warning("Database not connected, skipping history fetch.")
    except Exception as e:
        logger.error(f"Failed to fetch patient history: {e}")

    # 3. Analyze symptoms via Gemini
    symp_req = SymptomRequest(symptoms=symptoms, age=age, gender=gender, history=history_data)
    symp_results = await analyze_symptoms(symp_req)

    # 4. Analyze image if provided
    img_results = None
    if file:
        img_results = await analyze_medical_image(file)

    # 5. Combine results
    primary_diagnosis = symp_results.get("top_conditions", [{}])[0] if symp_results.get("top_conditions") else None
    combined = {
        "symptom_analysis": symp_results,
        "image_analysis": img_results,
        "primary_diagnosis": primary_diagnosis,
        "medical_advice": symp_results.get("medical_advice", "Review case manually.")
    }

    # 6. Save to MongoDB patient_history
    try:
        ai_conditions = symp_results.get("top_conditions", [])
        precautions   = symp_results.get("precautions", [])
        explanation   = symp_results.get("explanation", "")
        what_to_do    = symp_results.get("what_to_do", [])
        advice_text   = explanation
        if what_to_do:
            advice_text += " Steps: " + "; ".join(what_to_do)

        print("Saving diagnosis to MongoDB...")
        
        insert_data = {
            "user_id":      user_id,
            "symptoms":     symptoms,
            "ai_conditions": ai_conditions,
            "precautions":  precautions,
            "advice":       advice_text,
            "created_at":   datetime.now(timezone.utc)
        }
        
        logger.info(f"Attempting MongoDB insert for user: {user_id}")
        db = get_db()
        if db is not None:
            insert_res = db.patient_history.insert_one(insert_data)
            logger.info(f"MongoDB insert successful with id: {insert_res.inserted_id}")
            print("Diagnosis saved to MongoDB successfully ✅")
        else:
            logger.error("Database connection not established")
            print("Failed to save to MongoDB: Connection not established")

    except Exception as e:
        logger.error(f"Failed to save diagnosis to MongoDB: {e}")
        print(f"Failed to save to MongoDB: {e}")

    return combined

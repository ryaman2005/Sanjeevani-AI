from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.symptom_analyzer import analyze_symptoms, SymptomRequest
from services.image_analyzer import analyze_medical_image
from db.supabase_client import supabase
import uuid

router = APIRouter(prefix="/analyze", tags=["analysis"])

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
    # 1. Fetch recent history for context
    history_data = []
    try:
        if worker_id != "00000000-0000-0000-0000-000000000000":
             user_id = worker_id
        else:
             # Use a mock UUID representing the anonymous user
             user_id = "11111111-1111-1111-1111-111111111111"
             
        history_res = supabase.table("patient_history").select("symptoms", "created_at").eq("user_id", user_id).order("created_at", desc=True).limit(3).execute()
        if history_res.data:
            history_data = history_res.data
    except Exception as e:
        print(f"Failed to fetch history: {e}")

    # 2. Analyze symptoms
    symp_req = SymptomRequest(symptoms=symptoms, age=age, gender=gender, history=history_data)
    symp_results = await analyze_symptoms(symp_req)
    
    # 2. Analyze image if provided
    img_results = None
    if file:
        img_results = await analyze_medical_image(file)
        
    # 3. Combine results
    primary_diagnosis = symp_results.get("top_conditions", [{}])[0] if "top_conditions" in symp_results and len(symp_results["top_conditions"]) > 0 else None
    
    combined = {
        "symptom_analysis": symp_results,
        "image_analysis": img_results,
        "primary_diagnosis": primary_diagnosis,
        "medical_advice": symp_results.get("medical_advice", "Review case manually.")
    }
    
    # 4. Save to Supabase DB
    try:
        user_id_for_db = worker_id if worker_id and worker_id != "00000000-0000-0000-0000-000000000000" else "11111111-1111-1111-1111-111111111111"
        
        # Save explicitly to the new patient_history table
        top_conds = symp_results.get("top_conditions", [])
        precautions = symp_results.get("precautions", [])
        explanation = symp_results.get("explanation", "")
        advice_str = f"{explanation} Precautions: {', '.join(precautions) if precautions else 'None specified.'}"

        supabase.table("patient_history").insert({
            "user_id": user_id_for_db,
            "symptoms": symptoms,
            "diagnosis": top_conds,
            "advice": advice_str
        }).execute()

        # Legacy session save (Best Effort)
        patient_res = supabase.table("patients").insert({
            "name": "Anonymous",
            "age": age,
            "gender": gender
        }).execute()
        
        if patient_res.data and len(patient_res.data) > 0:
            patient_id = patient_res.data[0]["id"]
            
            # Save the session document
            supabase.table("sessions").insert({
                "patient_id": patient_id,
                "symptoms": symptoms,
                "diagnosis": symp_results,
                "severity": "Medium", # Fallback default
                "worker_id": worker_id
            }).execute()
    except Exception as e:
        print(f"Failed to save to Supabase: {e}")
    
    return combined

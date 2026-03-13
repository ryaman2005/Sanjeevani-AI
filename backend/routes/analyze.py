from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.symptom_analyzer import analyze_symptoms, SymptomRequest
from services.image_analyzer import analyze_medical_image
from services.llm_service import fuse_diagnoses

router = APIRouter(prefix="/analyze", tags=["analysis"])

@router.post("/symptoms")
async def analyze_symptoms_route(request: SymptomRequest):
    result = await analyze_symptoms(request)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
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
    file: Optional[UploadFile] = File(None)
):
    # 1. Analyze symptoms
    symp_req = SymptomRequest(symptoms=symptoms, age=age, gender=gender)
    symp_results = await analyze_symptoms(symp_req)
    
    # 2. Analyze image if provided
    img_results = {
        "findings": "No image uploaded.",
        "conditions": [],
        "confidence": 0
    }
    if file:
        img_results = await analyze_medical_image(file)
        
    # 3. Use AI Fusion Layer (Phase 5.1)
    combined_results = await fuse_diagnoses(symp_results, img_results)
    
    # 4. Attach original individual analyses for UI transparency
    combined_results["symptom_analysis"] = symp_results
    combined_results["image_analysis"] = img_results
    
    return combined_results

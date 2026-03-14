from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import json
import re
import logging
from datetime import datetime, timezone
from dotenv import load_dotenv

import google.generativeai as genai


from db.mongodb_client import get_db


load_dotenv(".env", override=True)
load_dotenv(".env.local", override=True)

router = APIRouter(prefix="/analyze-prescription", tags=["prescription"])
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

API_KEY = os.environ.get("GEMINI_API_KEY")

if API_KEY:
    genai.configure(api_key=API_KEY)


@router.post("/")
async def analyze_prescription(file: UploadFile = File(...)):

    if not file:
        raise HTTPException(status_code=400, detail="No file sent")

    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    if not API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key missing")

    model = genai.GenerativeModel("gemini-2.5-flash")

    system_prompt = """
You are an expert medical AI specialized in reading and digitizing handwritten or printed medical prescriptions.

Extract and return ONLY valid JSON in this format:

{
  "doctor": "Name of the doctor",
  "clinic": "Clinic or hospital name",
  "medicines": [
    {
      "name": "Medicine name",
      "dosage": "Dosage e.g. 500mg",
      "instructions": "How to take the medicine"
    }
  ],
  "precautions": [
    "precaution 1",
    "precaution 2"
  ],
  "summary": "Short patient friendly explanation"
}

Return ONLY JSON.
Do NOT add markdown or explanation text.
"""

    try:

        mime_type = "application/pdf" if ext == ".pdf" else f"image/{ext[1:]}"

        if mime_type == "image/jpg":
            mime_type = "image/jpeg"

        response = model.generate_content(
    [
        {
            "mime_type": mime_type,
            "data": file_bytes
        },
        system_prompt
    ],
    generation_config=genai.types.GenerationConfig(
        temperature=0.1
    )
)

        result_text = response.text.strip()

        # Remove markdown formatting if Gemini adds it
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        # Safe JSON extraction
        json_match = re.search(r"\{.*\}", result_text, re.DOTALL)

        if not json_match:
            raise ValueError("No JSON detected in Gemini output")

        parsed_json = json.loads(json_match.group())

        # -------------------------------
        # Save result to MongoDB history
        # -------------------------------

        try:

            user_id = "11111111-1111-1111-1111-111111111111"

            medicines = parsed_json.get("medicines", [])

            ai_conditions = [
                {"disease": m.get("name"), "probability": 50}
                for m in medicines
            ]

            record = {
                "user_id": user_id,
                "symptoms": f"Prescription Analysis: {parsed_json.get('summary', 'No summary')}",
                "ai_conditions": ai_conditions,
                "precautions": parsed_json.get("precautions", []),
                "advice": f"Doctor: {parsed_json.get('doctor', 'Unknown')}. Clinic: {parsed_json.get('clinic', 'Unknown')}. {parsed_json.get('summary', '')}",
                "created_at": datetime.now(timezone.utc)
            }

            db = get_db()

            if db is None:
                raise Exception("Database connection not established")

            insert_res = db.patient_history.insert_one(record)

            logger.info(f"Prescription saved to MongoDB with id: {insert_res.inserted_id}")

        except Exception as e:
            logger.error(f"Failed to save prescription: {e}")

        return parsed_json

    except json.JSONDecodeError:
        logger.error(f"JSON parsing error from Gemini: {result_text}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
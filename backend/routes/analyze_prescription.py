from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv(".env", override=True)
load_dotenv(".env.local", override=True)

router = APIRouter(prefix="/analyze-prescription", tags=["prescription"])

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
API_KEY = os.environ.get("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

@router.post("/")
async def analyze_prescription(file: UploadFile = File(...)):
    if not file:
        raise HTTPException(status_code=400, detail="No file sent")

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")

    # Read the file
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")

    if not API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is missing")

    model = genai.GenerativeModel('gemini-2.5-flash')

    system_prompt = """
    You are an expert medical AI specialized in reading and digitizing handwritten and printed medical prescriptions.
    Examine the provided prescription image carefully.
    
    Extract the following information and return it STRICTLY as a JSON object matching this exact structure:
    {
      "doctor": "Name of the doctor (leave empty string if not found)",
      "clinic": "Name of the clinic or hospital (leave empty string if not found)",
      "medicines": [
        {"name": "Medicine name", "dosage": "Dosage (e.g., 500mg, 1 tablet)", "instructions": "How to take it (e.g., twice a day after meals)"}
      ],
      "precautions": [
        "Precaution 1",
        "Precaution 2"
      ],
      "summary": "A simple, patient-friendly 1-2 sentence summary of what this prescription is for"
    }

    Return ONLY the valid JSON object. Do not include markdown formatting like ```json or any other surrounding text.
    """

    try:
        mime_type = "application/pdf" if ext == ".pdf" else f"image/{ext[1:]}"
        # Some quick normalization
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
                temperature=0.1, # Low temperature for more deterministic data extraction
            )
        )
        
        result_text = response.text.strip()
        
        # Guard against Gemini adding markdown formatting
        if result_text.startswith("```json"):
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif result_text.startswith("```"):
            result_text = result_text.split("```")[1].split("```")[0].strip()
            
        # Parse it to ensure it's valid JSON before returning
        parsed_json = json.loads(result_text)
        return parsed_json

    except json.JSONDecodeError as e:
         print(f"JSON Parsing Error: {e}\nRaw output: {result_text}")
         raise HTTPException(status_code=500, detail="Failed to parse structured response from AI.")
    except Exception as e:
        import traceback
        print("Error analyzing prescription:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

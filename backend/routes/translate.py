from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
from google import genai
from google.genai import types

router = APIRouter(prefix="/translate", tags=["translation"])

class TranslationRequest(BaseModel):
    text: str # Usually a stringified JSON of the diagnosis parts
    language: str

class TranslationResponse(BaseModel):
    translated_text: str

API_KEY = os.environ.get("GEMINI_API_KEY")

@router.post("/", response_model=TranslationResponse)
async def translate_medical_text(request: TranslationRequest):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is missing")
        
    client = genai.Client(api_key=API_KEY)
    
    system_prompt = f"You are an expert medical translator. Translate the provided medical text into {request.language} accurately. If the input is a JSON string, you MUST translate the values but preserve the exact JSON structure and keys intact. Return ONLY the translated text or JSON. Do not add markdown backticks."
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=request.text,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.1,
            ),
        )
        
        result_text = response.text.strip()
        
        # Strip markdown if Gemini accidentally included it
        if result_text.startswith("```json"):
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif result_text.startswith("```"):
            result_text = result_text.split("```")[1].split("```")[0].strip()
            
        return TranslationResponse(translated_text=result_text)
    except Exception as e:
        print(f"Error translating: {e}")
        raise HTTPException(status_code=500, detail="Failed to translate text.")

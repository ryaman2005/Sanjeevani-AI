import json
import os
import httpx
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted

load_dotenv(".env", override=True)
load_dotenv(".env.local", override=True)

# Check for Gemini key
API_KEY = os.environ.get("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

class SymptomRequest(BaseModel):
    symptoms: str
    age: int
    gender: str
    history: list = []

# In Phase 1, we simulate the 773-disease dataset model by hitting a lightweight instruct model 
# to act as our clinical symptom-to-disease classifier.
async def analyze_symptoms(request: SymptomRequest):
    if not API_KEY:
        # Fallback for development without API key
        return {
            "diagnoses": [
                {"name": "Viral Fever", "confidence": 85},
                {"name": "Common Cold", "confidence": 60},
            ],
            "severity": "Low",
            "advice": "Rest and hydration. Monitor for 48 hours."
        }

    # Using Google Gemini-2.5-Flash since 1.5 threw a 404 locally.
    # We configured it at the module level
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    system_prompt = "You are a strict medical AI assistant for the Sanjeevani web application. You must ONLY answer medical-related questions and analyze symptoms. If the user asks a non-medical question, politely refuse to answer. You must respond strictly in valid JSON format without markdown blocks."
    
    history_context = ""
    if request.history:
        history_context = "\n\nPrevious history:\n"
        for record in request.history:
            date = record.get("created_at", "").split("T")[0] if "created_at" in record else "Past"
            symptoms = record.get("symptoms", "")
            history_context += f"* {date}: {symptoms}\n"
        history_context += "\nAnalyze both previous history and current symptoms and return a more personalized response."

    user_prompt = f"""Analyze these symptoms and provide the top 3 most probable diseases.
If the input is not a medical query or symptom, set top_conditions to an empty array and put your refusal in the explanation.

Patient details: Age {request.age}, Gender {request.gender}{history_context}
Current symptom(s) reported: {request.symptoms}

Respond EXACTLY in this JSON format strictly. Nothing else:
{{
  "top_conditions": [
    {{"disease": "Disease name", "probability": 90}},
    {{"disease": "Disease name", "probability": 50}}
  ],
  "explanation": "short explanation of the likely conditions",
  "precautions": [
    "precaution 1",
    "precaution 2"
  ],
  "what_to_do": [
    "recommended action 1",
    "recommended action 2"
  ],
  "emergency_signs": [
    "symptom requiring urgent medical attention (if any)"
  ]
}}"""

    try:
        response = model.generate_content(
            user_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                response_mime_type="application/json"
            )
        )
        
        result_text = response.text.strip()
        
        # Extract JSON from potential markdown blocks just in case
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()
        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()
            
        return json.loads(result_text)
    except ResourceExhausted as e:
        print("Gemini API Rate Limit Exceeded.")
        return {
            "top_conditions": [
                {"disease": "API Rate Limit Exceeded", "probability": 0}
            ],
            "explanation": "⚠️ The Gemini AI service has exceeded its query quota. Please wait a few moments before trying again or upgrade your API key.",
            "precautions": [],
            "what_to_do": [],
            "emergency_signs": []
        }
    except Exception as e:
        import traceback
        print("Gemini API Error in analyze_symptoms:")
        traceback.print_exc()
        return {
            "top_conditions": [
                {"disease": "Analysis Failed", "probability": 0}
            ],
            "explanation": "⚠️ Failed to reach the AI model. Please ensure the Gemini API key is correct and valid.",
            "precautions": [],
            "what_to_do": [],
            "emergency_signs": []
        }

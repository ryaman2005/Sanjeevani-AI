import json
import os
from pydantic import BaseModel, Field
from typing import List, Dict
from dotenv import load_dotenv
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted

load_dotenv(".env", override=True)
load_dotenv(".env.local", override=True)

API_KEY = os.environ.get("GEMINI_API_KEY")

if API_KEY:
    genai.configure(api_key=API_KEY)


class SymptomRequest(BaseModel):
    symptoms: str
    age: int
    gender: str
    history: List[Dict] = Field(default_factory=list)


async def analyze_symptoms(request: SymptomRequest):

    if not API_KEY:
        return {
            "top_conditions": [
                {"disease": "Viral Fever", "probability": 85},
                {"disease": "Common Cold", "probability": 60},
            ],
            "explanation": "Likely viral infection based on symptoms.",
            "precautions": [
                "Drink plenty of fluids",
                "Take adequate rest"
            ],
            "what_to_do": [
                "Monitor symptoms for 48 hours",
                "Consult doctor if symptoms worsen"
            ],
            "emergency_signs": []
        }

    model = genai.GenerativeModel("gemini-2.5-flash")

    system_prompt = """
You are a strict medical AI assistant for the Sanjeevani healthcare application.

Rules:
- Only answer medical questions
- If the query is not medical, politely refuse
- Provide safe medical guidance
- Do NOT hallucinate medicines
- Always return valid JSON
"""

    # ----------------------------
    # Build patient history context
    # ----------------------------

    history_context = ""

    if request.history:

        history_context = "\n\nPrevious patient history:\n"

        for record in request.history:

            created_at = record.get("created_at")

            if created_at:
                try:
                    date = created_at.strftime("%Y-%m-%d")
                except:
                    date = "Past"
            else:
                date = "Past"

            symptoms = record.get("symptoms", "")
            conditions = record.get("ai_conditions", [])

            history_context += f"* {date}: {symptoms} | previous diagnosis: {conditions}\n"

        history_context += "\nUse this medical history when analyzing current symptoms."

    # ----------------------------
    # User prompt
    # ----------------------------

    user_prompt = f"""
Analyze the patient's symptoms and return the top 3 possible medical conditions.

Patient details:
Age: {request.age}
Gender: {request.gender}

{history_context}

Current symptoms:
{request.symptoms}

Respond STRICTLY in JSON format:

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
    "symptom requiring urgent medical attention"
  ]
}}
"""

    try:

        response = model.generate_content(
            [system_prompt, user_prompt],
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                response_mime_type="application/json"
            )
        )

        result_text = response.text.strip()

        # Remove markdown formatting if Gemini adds it
        if "```json" in result_text:
            result_text = result_text.split("```json")[1].split("```")[0].strip()

        elif "```" in result_text:
            result_text = result_text.split("```")[1].split("```")[0].strip()

        return json.loads(result_text)

    except ResourceExhausted:

        return {
            "top_conditions": [
                {"disease": "API Rate Limit Exceeded", "probability": 0}
            ],
            "explanation": "⚠️ Gemini API quota exceeded. Please wait and try again.",
            "precautions": [],
            "what_to_do": [],
            "emergency_signs": []
        }

    except Exception as e:

        import traceback
        traceback.print_exc()

        return {
            "top_conditions": [
                {"disease": "Analysis Failed", "probability": 0}
            ],
            "explanation": "⚠️ Failed to analyze symptoms. Check Gemini API key or server logs.",
            "precautions": [],
            "what_to_do": [],
            "emergency_signs": []
        }
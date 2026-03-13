import json
import os
import httpx
from pydantic import BaseModel

HF_API_KEY = os.environ.get("HUGGINGFACE_API_KEY")

class SymptomRequest(BaseModel):
    symptoms: str
    age: int
    gender: str

# In Phase 1, we simulate the 773-disease dataset model by hitting a lightweight instruct model 
# to act as our clinical symptom-to-disease classifier.
async def analyze_symptoms(request: SymptomRequest):
    if not HF_API_KEY:
        # Fallback for development without API key
        return {
            "diagnoses": [
                {"name": "Viral Fever", "confidence": 85},
                {"name": "Common Cold", "confidence": 60},
            ],
            "severity": "Low",
            "advice": "Rest and hydration. Monitor for 48 hours."
        }

    # Using a free open-weight model on HuggingFace Inference API
    # Since we can't easily host a 773-class sklearn model directly on Vercel/Railway without
    # bundling the pkl file, we'll use LLM zero-shot classification as a robust MVP.
    API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3"
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}

    prompt = f"""[INST] You are an AI medical assistant for rural healthcare workers.
Analyze these symptoms and provide the top 3 most likely diagnoses.
Patient details: Age {request.age}, Gender {request.gender}
Symptoms reported: {request.symptoms}

Respond EXACTLY in this JSON format strictly:
{{
  "diagnoses": [
    {{"name": "Disease 1", "confidence": 90}},
    {{"name": "Disease 2", "confidence": 50}}
  ],
  "severity": "Low" | "Medium" | "URGENT",
  "advice": "Short actionable advice for the healthcare worker"
}}
[/INST]"""

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                API_URL, 
                headers=headers, 
                json={"inputs": prompt, "parameters": {"max_new_tokens": 200, "temperature": 0.1, "return_full_text": False}}
            )
            response.raise_for_status()
            result_text = response.json()[0]["generated_text"].strip()
            
            # Extract JSON from potential markdown blocks
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0].strip()
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0].strip()
                
            return json.loads(result_text)
        except Exception as e:
            print(f"Error calling HF API: {e}")
            return {
                "error": "Failed to analyze symptoms",
                "diagnoses": [{"name": "Analysis Failed", "confidence": 0}],
                "severity": "Unknown",
                "advice": "Please consult a doctor directly."
            }

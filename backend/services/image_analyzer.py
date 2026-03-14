import os
import httpx
from fastapi import UploadFile

HF_API_KEY = os.environ.get("HUGGINGFACE_API_KEY")

async def analyze_medical_image(file: UploadFile):
    if not HF_API_KEY:
        # Fallback for development
        return {
            "findings": "Image received successfully. Simulating AI analysis...",
            "conditions": [
                {"name": "No obvious abnormalities", "confidence": 75},
            ],
            "confidence": 75.0
        }

    # For phase 1 MVP, we use a simple image classification model from HF
    # that handles general medical conditions.
    API_URL = "https://api-inference.huggingface.co/models/imfarzanansari/skintelligent-acne"
    headers = {"Authorization": f"Bearer {HF_API_KEY}"}
    
    try:
        image_bytes = await file.read()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                API_URL, 
                headers=headers, 
                content=image_bytes
            )
            response.raise_for_status()
            results = response.json()
            
            # Format results
            conditions = []
            if isinstance(results, list):
                for res in results[:3]:
                    conditions.append({
                        "name": res.get("label", "Unknown").replace("_", " ").title(),
                        "confidence": int(res.get("score", 0) * 100)
                    })
                    
            return {
                "findings": f"Detected potential visual markers matching {conditions[0]['name'] if conditions else 'unknown condition'}.",
                "conditions": conditions,
                "confidence": conditions[0]['confidence'] if conditions else 0
            }
            
    except Exception as e:
        print(f"Error calling HF Image API: {e}")
        return {
            "error": "Failed to analyze image",
            "findings": "Analysis service unavailable.",
            "conditions": [],
            "confidence": 0
        }

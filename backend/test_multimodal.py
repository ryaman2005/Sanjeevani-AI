import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv(".env")

async def test_combined():
    url = "http://localhost:8000/analyze/combined"
    
    # Simulate a skin-related case (Acne/Rash)
    files = {
        "file": ("test_skin.jpg", b"fake-image-content", "image/jpeg") 
    }
    data = {
        "symptoms": "Red itchy bumps on the face and forehead for 2 weeks.",
        "age": 19,
        "gender": "Female"
    }

    async with httpx.AsyncClient() as client:
        try:
            print(f"Testing combined multimodal analysis at {url}...")
            response = await client.post(url, data=data, files=files, timeout=60.0)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print("\n --- UNIFIED DIAGNOSIS ---")
                print(f"Primary: {result['primary_diagnosis']['name']} ({result['primary_diagnosis']['confidence']}%)")
                print(f"Severity: {result['severity']}")
                print(f"Narrative: {result['narrative']}")
                print("\n --- RAW SYMPTOM FINDINGS ---")
                print(result['symptom_analysis'])
            else:
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"Connection Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_combined())

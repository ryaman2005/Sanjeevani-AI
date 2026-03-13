import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv(".env")

async def test_symptoms():
    url = "http://localhost:8000/analyze/symptoms"
    payload = {
        "symptoms": "High fever, persistent cough, and loss of taste for 5 days.",
        "age": 45,
        "gender": "Male"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"Testing symptom analysis at {url}...")
            response = await client.post(url, json=payload, timeout=30.0)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_symptoms())

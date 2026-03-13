import os
import httpx
from dotenv import load_dotenv

load_dotenv(".env")
key = os.environ.get("HUGGINGFACE_API_KEY")

models = [
    "meta-llama/Llama-3.1-8B-Instruct",
    "mistralai/Mistral-7B-Instruct-v0.2",
    "HuggingFaceH4/zephyr-7b-beta",
    "BioMistral/BioMistral-7B-Instruct"
]

async def check_models():
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient() as client:
        for model in models:
            url = "https://router.huggingface.co/v1/chat/completions"
            try:
                print(f"Checking model: {model}...")
                payload = {
                    "model": model,
                    "messages": [{"role": "user", "content": "Hi"}],
                    "max_tokens": 10
                }
                response = await client.post(url, headers=headers, json=payload, timeout=10.0)
                print(f"  Status: {response.status_code}")
                if response.status_code == 200:
                    print(f"  SUCCESS: {model} is available!")
                else:
                    print(f"  FAILED: {response.text[:200]}")
            except Exception as e:
                print(f"  ERROR: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(check_models())

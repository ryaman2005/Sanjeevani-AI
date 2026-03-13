from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv(".env.local")
load_dotenv(".env")

app = FastAPI(title="Rural AI Medical Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development, wide open is fine. Vercel adds specific URL in prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes import analyze, patients
app.include_router(analyze.router)
app.include_router(patients.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Rural AI API is running"}

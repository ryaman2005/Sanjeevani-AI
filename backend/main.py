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

from routes import analyze, profiles, translate, upload, analyze_prescription, test_db, patients
app.include_router(analyze.router)
app.include_router(profiles.router)
app.include_router(translate.router)
app.include_router(upload.router)
app.include_router(analyze_prescription.router)
app.include_router(test_db.router)
app.include_router(patients.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Rural AI API is running"}

@app.get("/")
def root():
    return {"message": "Welcome to the Sanjeevani AI API"}
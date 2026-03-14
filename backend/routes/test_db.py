from fastapi import APIRouter
from db.mongodb_client import get_db
import logging
from datetime import datetime, timezone

router = APIRouter(tags=["test_db"])
logger = logging.getLogger(__name__)

@router.get("/test-db")
async def test_db_connection():
    """Test endpoint: inserts a sample row and fetches it to verify MongoDB connectivity."""
    try:
        sample = {
            "user_id": "test-user-123",
            "symptoms": "Test data for MongoDB connection validation",
            "ai_conditions": ["Test Condition"],
            "precautions": ["Test precaution 1"],
            "advice": "Test advice",
            "created_at": datetime.now(timezone.utc)
        }

        logger.info(f"[TEST] Attempting to insert into MongoDB: {sample}")
        
        db = get_db()
        if db is None:
            return {"status": "Error", "message": "Database connection not established"}
            
        insert_res = db.patient_history.insert_one(sample)
        inserted_id = str(insert_res.inserted_id)

        # Remove _id for JSON serialization before returning
        fetch_res = db.patient_history.find_one({"_id": insert_res.inserted_id}, {"_id": 0})

        return {"status": "MongoDB connection working ✅", "inserted_id": inserted_id, "latest_record": fetch_res}

    except Exception as e:
        logger.exception("[TEST] Unexpected error during MongoDB test")
        return {"status": "Error", "message": str(e)}


@router.get("/patient-history/latest")
async def get_latest_history(user_id: str):
    """Fetch the last 3 patient history records for a given user."""
    try:
        db = get_db()
        if db is None:
            return {"status": "Error", "message": "Database connection not established"}
            
        cursor = db.patient_history.find({"user_id": user_id}).sort("created_at", -1).limit(3)
        records = list(cursor)
        
        # Remove ObjectIds to make them JSON serializable
        for r in records:
            if "_id" in r:
                r["_id"] = str(r["_id"])
                
        return {
            "status": "Success",
            "user_id": user_id,
            "records": records
        }
    except Exception as e:
        logger.exception("[HISTORY] Failed to fetch latest patient history")
        return {"status": "Error", "message": str(e)}

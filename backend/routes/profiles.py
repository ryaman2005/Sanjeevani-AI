
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from db.mongodb_client import get_db

router = APIRouter(prefix="/profiles", tags=["profiles"])

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    region: Optional[str] = None
    role: Optional[str] = None

@router.get("/{user_id}")
async def get_profile(user_id: str):
    try:
        db = get_db()
        if db is None:
            raise Exception("Database connection not established")
            
        profile = db.profiles.find_one({"id": user_id}, {"_id": 0})
        if not profile:
            # Create a default profile if it doesn't exist
            # Note: In a real app, this would be handled on signup
            default_profile = {
                "id": user_id,
                "full_name": "New Healthcare Worker",
                "role": "Health Worker",
                "region": "Rural Area",
                "updated_at": datetime.now().isoformat()
            }
            db.profiles.insert_one(default_profile)
            # Remove _id from result before returning just in case
            if "_id" in default_profile:
                del default_profile["_id"]
            return default_profile
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}")
async def update_profile(user_id: str, profile: ProfileUpdate):
    try:
        update_data = {k: v for k, v in profile.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now().isoformat()
        
        db = get_db()
        if db is None:
            raise Exception("Database connection not established")
            
        from pymongo import ReturnDocument
        result = db.profiles.find_one_and_update(
            {"id": user_id},
            {"$set": update_data},
            return_document=ReturnDocument.AFTER
        )
        if not result:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        if "_id" in result:
            del result["_id"]
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


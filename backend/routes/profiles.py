from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os
from supabase import create_client, Client

router = APIRouter(prefix="/profiles", tags=["profiles"])

# Supabase setup
url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_ANON_KEY", "")
supabase: Client = create_client(url, key)

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    region: Optional[str] = None
    role: Optional[str] = None

@router.get("/{user_id}")
async def get_profile(user_id: str):
    try:
        response = supabase.table("profiles").select("*").eq("id", user_id).execute()
        if not response.data:
            # Create a default profile if it doesn't exist
            # Note: In a real app, this would be handled on signup
            default_profile = {
                "id": user_id,
                "full_name": "New Healthcare Worker",
                "role": "Health Worker",
                "region": "Rural Area",
                "updated_at": datetime.now().isoformat()
            }
            create_response = supabase.table("profiles").insert(default_profile).execute()
            return create_response.data[0]
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}")
async def update_profile(user_id: str, profile: ProfileUpdate):
    try:
        update_data = {k: v for k, v in profile.dict().items() if v is not None}
        update_data["updated_at"] = datetime.now().isoformat()
        
        response = supabase.table("profiles").update(update_data).eq("id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

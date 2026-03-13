import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        # Avoid crashing immediately on import, allow local mock testing
        class MockClient:
            def table(self, name):
                return self
            def select(self, *args, **kwargs):
                return self
            def insert(self, *args, **kwargs):
                return self
            def execute(self):
                return type("Response", (), {"data": [], "error": None})()
        return MockClient()
        
    return create_client(SUPABASE_URL, SUPABASE_KEY)

supabase = get_supabase_client()

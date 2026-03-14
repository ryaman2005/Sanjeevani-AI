import os
from pymongo import MongoClient
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

MONGODB_URI = os.environ.get("MONGODB_URI")

if not MONGODB_URI:
    logger.warning("MONGODB_URI is not set in environment variables. Database connections will fail.")

client = None
db = None

if MONGODB_URI:
    try:
        client = MongoClient(MONGODB_URI)
        db = client["sanjeevani_ai"]
        logger.info("Successfully initialized MongoDB client.")
    except Exception as e:
        logger.error(f"Failed to initialize MongoDB client: {e}")

def get_db():
    return db
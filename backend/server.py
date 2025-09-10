from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import os
from dotenv import load_dotenv

# -----------------------------------------------------------------------------
# Environment variable loading from multiple sources
# -----------------------------------------------------------------------------
# Load .env files from project root and Render Secret Files location
load_dotenv()  # Load from project root .env
load_dotenv("/etc/secrets/.env")  # Load from Render Secret Files


def get_first_env_value(keys: List[str]) -> Optional[str]:
    """Get the first non-empty value from a list of environment variable keys."""
    for key in keys:
        value = os.getenv(key)
        if value:
            return value
    return None


# -----------------------------------------------------------------------------
# App and Router setup
# -----------------------------------------------------------------------------
app = FastAPI(title="Asset Inventory API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Open CORS for simplicity (adjust for production as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # set specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# Database setup (graceful if env missing/bad)
# -----------------------------------------------------------------------------
# Check for MongoDB URI using multiple possible environment variable names
MONGODB_URI_KEYS = ["MONGODB_URI", "MONGO_URI", "MONGO_URL", "DATABASE_URL"]
MONGODB_DB_NAME_KEYS = ["MONGODB_DB_NAME", "DB_NAME"]

MONGODB_URI = get_first_env_value(MONGODB_URI_KEYS)
MONGODB_DB_NAME = get_first_env_value(MONGODB_DB_NAME_KEYS) or "emergent_inventory"

client: Optional[AsyncIOMotorClient] = None
db = None


# Log environment variable detection for debugging
def log_env_detection():
    """Log which environment variables were detected for MongoDB connection."""
    if MONGODB_URI:
        # Find which key was used
        used_key = None
        for key in MONGODB_URI_KEYS:
            if os.getenv(key) == MONGODB_URI:
                used_key = key
                break

        # Find which DB name key was used
        db_name_key = None
        for key in MONGODB_DB_NAME_KEYS:
            if os.getenv(key):
                db_name_key = key
                break
        if not db_name_key:
            db_name_key = "default"

        print(f"✅ Using Mongo URL from: {used_key}; "
              f"DB name key: {db_name_key} (value redacted)")
    else:
        # Check which keys are present but empty/invalid
        present_keys = [key for key in MONGODB_URI_KEYS if key in os.environ]
        print(f"⚠️ Mongo URL not found. Checked keys: "
              f"{', '.join(MONGODB_URI_KEYS)}. Present keys: {present_keys}")


log_env_detection()

try:
    if MONGODB_URI:
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[MONGODB_DB_NAME]
        print(f"✅ Connected to MongoDB database: {MONGODB_DB_NAME}")
    else:
        print("⚠️ API will start but database operations will fail.")
except Exception as e:
    # Do not crash the server; log only
    print(f"❌ Failed to connect to MongoDB: {e}")
    db = None


def ensure_db():
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected/configured")


# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class UserRole(str, Enum):
    supervisor = "supervisor"
    engineer = "engineer"


class UserCreate(BaseModel):
    name: str
    role: str  # 'supervisor' or 'engineer' (accept as string input)
    pin: str
    created_by: Optional[str] = None


class UserUpdate(BaseModel):
    name: str
    role: str
    pin: str


class UserResponse(BaseModel):
    id: str
    name: str
    role: str
    pin: str
    created_at: Optional[str] = None
    last_login: Optional[str] = None
    created_by: Optional[str] = None


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    role: UserRole
    pin: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[str] = None
    created_by: Optional[str] = None


# -----------------------------------------------------------------------------
# Health checks
# -----------------------------------------------------------------------------
@app.get("/")
async def root_health():
    return {"message": "Asset Inventory API is running", "time": datetime.utcnow().isoformat()}


@api_router.get("/")
async def api_health():
    return {"message": "Asset Inventory API (router) is running",
            "time": datetime.utcnow().isoformat()}


# -----------------------------------------------------------------------------
# Diagnostic endpoint (optional, guarded by DIAGNOSTICS_ENABLED)
# -----------------------------------------------------------------------------
@api_router.get("/diag/env-keys")
async def get_env_keys_diagnostic():
    """Return presence of relevant environment variables (values never returned)."""
    if not os.getenv("DIAGNOSTICS_ENABLED", "").lower() == "true":
        raise HTTPException(status_code=404,
                            detail="Diagnostic endpoint not enabled")

    # Check presence of all relevant environment variables
    all_keys = MONGODB_URI_KEYS + MONGODB_DB_NAME_KEYS
    result = {}
    for key in all_keys:
        result[key] = key in os.environ and bool(os.getenv(key))

    return result


# -----------------------------------------------------------------------------
# Startup tasks (safe/no-crash)
# -----------------------------------------------------------------------------
@app.on_event("startup")
async def create_default_users():
    if db is None:
        print("ℹ️ Skipping default user creation; database not connected.")
        return
    try:
        user_count = await db.users.count_documents({})
        if user_count == 0:
            default_users = [
                {"id": "lee_carter", "name": "Lee Carter", "role": "supervisor", "pin": "1234"},
                {"id": "dan_carter", "name": "Dan Carter", "role": "supervisor", "pin": "1234"},
                {"id": "lee_paull", "name": "Lee Paull", "role": "engineer", "pin": "1234"},
                {"id": "dean_turnill", "name": "Dean Turnill", "role": "engineer", "pin": "1234"},
                {"id": "luis", "name": "Luis", "role": "engineer", "pin": "1234"},
            ]
            for data in default_users:
                user = User(**data)
                await db.users.insert_one(user.model_dump())
            print("✅ Default users created")
        else:
            print(f"ℹ️ Users already exist: {user_count}")
    except Exception as e:
        # Log but do not raise, keep the app running
        print(f"❌ Error creating default users: {e}")


# -----------------------------------------------------------------------------
# User routes
# -----------------------------------------------------------------------------
@api_router.get("/users", response_model=List[User])
async def get_users():
    ensure_db()
    users = await db.users.find().to_list(1000)
    # Coerce DB docs to User models for consistent schema
    return [User(**user) for user in users]


@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    ensure_db()
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_doc)


@api_router.post("/auth/login")
async def login(user_id: str):
    ensure_db()
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    user = User(**user_doc)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"last_login": datetime.utcnow().isoformat()}},
    )
    return {"token": user.id, "user": user}


@api_router.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreate):
    ensure_db()
    existing_user = await db.users.find_one({"name": user_data.name})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this name already exists")
    user_dict = user_data.model_dump()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["created_at"] = datetime.utcnow().isoformat()
    await db.users.insert_one(user_dict)
    return UserResponse(**user_dict)


@api_router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate):
    ensure_db()
    result = await db.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "name": user_data.name,
                "role": user_data.role,
                "pin": user_data.pin,
            }
        },
    )
    if result.matched_count == 0:
        return {"error": "User not found"}
    return {"success": True, "message": "User updated successfully"}


@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    ensure_db()
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


# -----------------------------------------------------------------------------
# Include router
# -----------------------------------------------------------------------------
app.include_router(api_router)

# Optional: local dev entrypoint (Render ignores this)
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))

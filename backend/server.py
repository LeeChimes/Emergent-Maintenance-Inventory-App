# backend/server.py

from fastapi import FastAPI, APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid
import os

# ---- Database (Motor / MongoDB) ----
# Render: set MONGO_URL and (optionally) MONGO_DB in your service environment.
# Example MONGO_URL: mongodb+srv://USER:PASS@CLUSTER.mongodb.net
# If MONGO_DB is not set, we'll use "chimes" as the database name.
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "chimes")

mongo_client: Optional[AsyncIOMotorClient] = None
db = None  # will be set in startup

# ---- FastAPI app & router ----
app = FastAPI(title="Chimes Backend", version="1.0.0")
api_router = APIRouter(prefix="/api")


# ---- Enums & Models ----
class UserRole(str, Enum):
    SUPERVISOR = "supervisor"
    ENGINEER = "engineer"
    ADMIN = "admin"
    VIEWER = "viewer"


class UserCreate(BaseModel):
    name: str
    role: str  # 'supervisor' or 'engineer' (or any of UserRole values)
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


# Primary user document used throughout the app
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    role: UserRole
    pin: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[str] = None
    created_by: Optional[str] = None


# ---- Health / Root ----
@app.get("/")
def root():
    return {"ok": True, "service": "Chimes Backend", "version": "1.0.0"}


@app.get("/healthz")
def healthz():
    return {"ok": True, "time": datetime.utcnow().isoformat()}


# ---- Startup / Shutdown ----
@app.on_event("startup")
async def on_startup():
    global mongo_client, db
    mongo_client = AsyncIOMotorClient(MONGO_URL)
    db = mongo_client[MONGO_DB]

    # Create default users once
    user_count = await db.users.count_documents({})
    if user_count == 0:
        default_users = [
            {"id": "lee_carter", "name": "Lee Carter", "role": "supervisor", "pin": "1234"},
            {"id": "dan_carter", "name": "Dan Carter", "role": "supervisor", "pin": "1234"},
            {"id": "lee_paull", "name": "Lee Paull", "role": "engineer", "pin": "1234"},
            {"id": "dean_turnill", "name": "Dean Turnill", "role": "engineer", "pin": "1234"},
            {"id": "luis", "name": "Luis", "role": "engineer", "pin": "1234"},
        ]
        for user_data in default_users:
            # Pydantic will coerce 'role' string to the UserRole enum
            user = User(**user_data)
            await db.users.insert_one(user.model_dump())
        print("Default users created")


@app.on_event("shutdown")
async def on_shutdown():
    global mongo_client
    if mongo_client:
        mongo_client.close()


# ---- User Routes ----
@api_router.get("/users", response_model=List[User])
async def get_users():
    users = await db.users.find().to_list(1000)
    # Ensure we return valid User models
    return [User(**u) for u in users]


@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user_doc)


@api_router.post("/auth/login")
async def login(user_id: str):
    user_doc = await db.users.find_one({"id": user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    user = User(**user_doc)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"last_login": datetime.utcnow().isoformat()}}
    )
    return {"token": user.id, "user": user}


@api_router.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreate):
    # Prevent duplicate names (simple uniqueness rule)
    existing_user = await db.users.find_one({"name": user_data.name})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this name already exists")

    user_dict = user_data.model_dump()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["created_at"] = datetime.utcnow().isoformat()

    # Validate against our canonical User model (coerces role -> UserRole)
    _ = User(
        id=user_dict["id"],
        name=user_dict["name"],
        role=user_dict["role"],  # string OK, will coerce to enum
        pin=user_dict["pin"],
        created_at=datetime.utcnow(),
        created_by=user_dict.get("created_by"),
    )

    await db.users.insert_one(user_dict)
    return UserResponse(**user_dict)


@api_router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate):
    # Validate role by constructing a temporary model (ensures enum coercion)
    try:
        _ = User(
            id=user_id,
            name=user_data.name,
            role=user_data.role,  # string OK, will coerce to enum
            pin=user_data.pin,
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid role")

    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "name": user_data.name,
            "role": user_data.role,
            "pin": user_data.pin,
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": "User updated successfully"}


@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


# ---- Mount API router ----
app.include_router(api_router)

# ---- NOTE ----
# Keep adding your other resources (materials, tools, etc.) below using the same pattern.
# Make sure any additional Enums are defined BEFORE the models that reference them.

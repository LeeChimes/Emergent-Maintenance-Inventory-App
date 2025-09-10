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


class UserRespon

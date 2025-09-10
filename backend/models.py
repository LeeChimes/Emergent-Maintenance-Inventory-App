from enum import Enum
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    TEAM = "team"
    VIEWER = "viewer"

class User(BaseModel):
    id: str
    name: str
    email: Optional[EmailStr] = None
    role: UserRole = UserRole.TEAM
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None


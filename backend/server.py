# ... [imports and setup stay the same] ...

# User Management Models
class UserCreate(BaseModel):
    name: str
    role: str  # 'supervisor' or 'engineer'
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

# FIXED User model to include PIN
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    role: UserRole
    pin: str  # <-- THIS LINE ADDED!
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[str] = None
    created_by: Optional[str] = None

# ... [all other models unchanged] ...

# Initialize default users
@app.on_event("startup")
async def create_default_users():
    user_count = await db.users.count_documents({})
    if user_count == 0:
        default_users = [
            {"id": "lee_carter", "name": "Lee Carter", "role": "supervisor", "pin": "1234"},
            {"id": "dan_carter", "name": "Dan Carter", "role": "supervisor", "pin": "1234"},
            {"id": "lee_paull", "name": "Lee Paull", "role": "engineer", "pin": "1234"},
            {"id": "dean_turnill", "name": "Dean Turnill", "role": "engineer", "pin": "1234"},
            {"id": "luis", "name": "Luis", "role": "engineer", "pin": "1234"}
        ]
        for user_data in default_users:
            user = User(**user_data)
            await db.users.insert_one(user.dict())
        print("Default users created")

# User routes
@api_router.get("/users", response_model=List[User])
async def get_users():
    users = await db.users.find().to_list(1000)
    return [User(**user) for user in users]

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

# User Management endpoints (Supervisor only)
@api_router.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreate):
    existing_user = await db.users.find_one({"name": user_data.name})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this name already exists")
    user_dict = user_data.dict()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["created_at"] = datetime.utcnow().isoformat()
    await db.users.insert_one(user_dict)
    return UserResponse(**user_dict)

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "name": user_data.name,
            "role": user_data.role,
            "pin": user_data.pin
        }}
    )
    if result.matched_count == 0:
        return {"error": "User not found"}
    return {"success": True, "message": "User updated successfully"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# ... [rest of your file unchanged - materials, tools, etc.] ...

from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import os

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
MONGODB_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "emergent_inventory")

client: Optional[AsyncIOMotorClient] = None
db = None

try:
    if MONGODB_URI:
        client = AsyncIOMotorClient(MONGODB_URI)
        db = client[MONGODB_DB_NAME]
        print(f"✅ Connected to MongoDB database: {MONGODB_DB_NAME}")
    else:
        print("⚠️ MONGODB_URI not set; API will start but database operations will fail.")
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


# Inventory Models
class ToolCondition(str, Enum):
    excellent = "excellent"
    good = "good"
    fair = "fair"
    poor = "poor"


class ToolStatus(str, Enum):
    available = "available"
    in_use = "in_use"
    maintenance = "maintenance"
    out_of_order = "out_of_order"


class TransactionType(str, Enum):
    in_ = "in"  # incoming/restocking
    out = "out"  # outgoing/usage
    adjust = "adjust"  # inventory adjustment


class Supplier(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class Material(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    quantity: int
    unit: Optional[str] = "pieces"
    min_stock: int
    location: Optional[str] = None
    supplier: Optional[Supplier] = None
    photo: Optional[str] = None
    qr_code: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MaterialCreate(BaseModel):
    name: str
    description: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    quantity: int
    unit: Optional[str] = "pieces"
    min_stock: int
    location: Optional[str] = None
    supplier: Optional[Supplier] = None
    photo: Optional[str] = None


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sku: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    unit: Optional[str] = None
    min_stock: Optional[int] = None
    location: Optional[str] = None
    supplier: Optional[Supplier] = None
    photo: Optional[str] = None


class Tool(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    condition: ToolCondition = ToolCondition.good
    status: ToolStatus = ToolStatus.available
    serial: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    current_user: Optional[str] = None
    service_records: Optional[List[dict]] = None
    next_service_due: Optional[str] = None
    photo: Optional[str] = None
    qr_code: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ToolCreate(BaseModel):
    name: str
    description: Optional[str] = None
    condition: ToolCondition = ToolCondition.good
    status: ToolStatus = ToolStatus.available
    serial: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    current_user: Optional[str] = None
    service_records: Optional[List[dict]] = None
    next_service_due: Optional[str] = None
    photo: Optional[str] = None


class ToolUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    condition: Optional[ToolCondition] = None
    status: Optional[ToolStatus] = None
    serial: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    current_user: Optional[str] = None
    service_records: Optional[List[dict]] = None
    next_service_due: Optional[str] = None
    photo: Optional[str] = None


class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: TransactionType
    item_type: Literal["material", "tool"]
    item_id: str
    quantity: Optional[int] = None  # For materials, None for tools
    note: Optional[str] = None
    user_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class TransactionCreate(BaseModel):
    type: TransactionType
    item_type: Literal["material", "tool"]
    item_id: str
    quantity: Optional[int] = None
    note: Optional[str] = None
    user_id: Optional[str] = None


# -----------------------------------------------------------------------------
# Health checks
# -----------------------------------------------------------------------------
@app.get("/")
async def root_health():
    return {"message": "Asset Inventory API is running", "time": datetime.utcnow().isoformat()}


@api_router.get("/")
async def api_health():
    return {"message": "Asset Inventory API (router) is running", "time": datetime.utcnow().isoformat()}


# -----------------------------------------------------------------------------
# Startup tasks (safe/no-crash)
# -----------------------------------------------------------------------------
@app.on_event("startup")
async def create_default_users_and_indexes():
    if db is None:
        print("ℹ️ Skipping default user creation and index setup; database not connected.")
        return
    
    try:
        # Create indexes for performance
        await db.users.create_index("id", unique=True)
        await db.materials.create_index("id", unique=True)
        await db.tools.create_index("id", unique=True)
        await db.transactions.create_index([("timestamp", -1)])  # Descending for recent-first
        print("✅ Database indexes created")
        
        # Create default users if none exist
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
        print(f"❌ Error in startup tasks: {e}")


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
# Inventory endpoints (MongoDB-backed)
# -----------------------------------------------------------------------------

# Materials endpoints
@api_router.get("/materials", response_model=List[Material])
async def list_materials():
    ensure_db()
    materials = await db.materials.find().to_list(1000)
    return [Material(**material) for material in materials]


@api_router.post("/materials", response_model=Material)
async def create_material(material_data: MaterialCreate):
    ensure_db()
    material_dict = material_data.model_dump()
    material = Material(**material_dict)
    # Generate QR code for the material
    material.qr_code = f"MAT-{material.id[:8]}"
    await db.materials.insert_one(material.model_dump())
    return material


@api_router.get("/materials/{material_id}", response_model=Material)
async def get_material(material_id: str):
    ensure_db()
    material_doc = await db.materials.find_one({"id": material_id})
    if not material_doc:
        raise HTTPException(status_code=404, detail="Material not found")
    return Material(**material_doc)


@api_router.put("/materials/{material_id}", response_model=Material)
async def update_material(material_id: str, material_data: MaterialUpdate):
    ensure_db()
    update_dict = {k: v for k, v in material_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_dict["updated_at"] = datetime.utcnow()
    result = await db.materials.update_one(
        {"id": material_id}, 
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    
    updated_material = await db.materials.find_one({"id": material_id})
    return Material(**updated_material)


# Tools endpoints
@api_router.get("/tools", response_model=List[Tool])
async def list_tools():
    ensure_db()
    tools = await db.tools.find().to_list(1000)
    return [Tool(**tool) for tool in tools]


@api_router.post("/tools", response_model=Tool)
async def create_tool(tool_data: ToolCreate):
    ensure_db()
    tool_dict = tool_data.model_dump()
    tool = Tool(**tool_dict)
    # Generate QR code for the tool
    tool.qr_code = f"TOOL-{tool.id[:8]}"
    await db.tools.insert_one(tool.model_dump())
    return tool


@api_router.get("/tools/{tool_id}", response_model=Tool)
async def get_tool(tool_id: str):
    ensure_db()
    tool_doc = await db.tools.find_one({"id": tool_id})
    if not tool_doc:
        raise HTTPException(status_code=404, detail="Tool not found")
    return Tool(**tool_doc)


@api_router.put("/tools/{tool_id}", response_model=Tool)
async def update_tool(tool_id: str, tool_data: ToolUpdate):
    ensure_db()
    update_dict = {k: v for k, v in tool_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_dict["updated_at"] = datetime.utcnow()
    result = await db.tools.update_one(
        {"id": tool_id}, 
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    updated_tool = await db.tools.find_one({"id": tool_id})
    return Tool(**updated_tool)


# Alerts and transactions
@api_router.get("/alerts/low-stock")
async def low_stock():
    ensure_db()
    # Find materials where quantity < min_stock
    low_stock_materials = await db.materials.find({
        "$expr": {"$lt": ["$quantity", "$min_stock"]}
    }).to_list(1000)
    
    materials = [Material(**material) for material in low_stock_materials]
    return {"count": len(materials), "materials": materials}


@api_router.get("/transactions", response_model=List[Transaction])
async def list_transactions(limit: int = 20):
    ensure_db()
    transactions = await db.transactions.find().sort("timestamp", -1).limit(limit).to_list(limit)
    return [Transaction(**transaction) for transaction in transactions]


@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction_data: TransactionCreate):
    ensure_db()
    transaction = Transaction(**transaction_data.model_dump())
    await db.transactions.insert_one(transaction.model_dump())
    return transaction


# Seed endpoint for testing
@api_router.post("/seed")
async def seed_data():
    ensure_db()
    
    # Check if already seeded to make it idempotent
    material_count = await db.materials.count_documents({})
    tool_count = await db.tools.count_documents({})
    
    if material_count > 0 or tool_count > 0:
        return {"message": "Database already seeded", "materials": material_count, "tools": tool_count}
    
    # Sample materials
    sample_materials = [
        {
            "name": "Steel Rebar 12mm",
            "description": "High-grade steel reinforcement bar",
            "category": "Construction Materials",
            "quantity": 100,
            "unit": "pieces",
            "min_stock": 20,
            "location": "Warehouse A-1",
            "sku": "SRB-12MM"
        },
        {
            "name": "Safety Helmets",
            "description": "Construction safety helmets",
            "category": "Safety Equipment", 
            "quantity": 5,  # Low stock to trigger alert
            "unit": "pieces",
            "min_stock": 10,
            "location": "Safety Storage",
            "sku": "HELM-001"
        },
        {
            "name": "Concrete Mix",
            "description": "Ready-mix concrete blend",
            "category": "Construction Materials",
            "quantity": 50,
            "unit": "bags",
            "min_stock": 15,
            "location": "Warehouse B-2",
            "sku": "CONC-MIX"
        }
    ]
    
    # Sample tools
    sample_tools = [
        {
            "name": "Makita Drill XPH12Z",
            "description": "18V cordless drill driver",
            "category": "Power Tools",
            "condition": "good",
            "status": "available",
            "serial": "MKT-001-2023",
            "location": "Tool Room A-1"
        },
        {
            "name": "Impact Wrench",
            "description": "Heavy-duty impact wrench",
            "category": "Power Tools", 
            "condition": "excellent",
            "status": "available",
            "serial": "IMP-002-2023",
            "location": "Tool Room A-1"
        },
        {
            "name": "Circular Saw",
            "description": "7.25-inch circular saw",
            "category": "Power Tools",
            "condition": "fair",
            "status": "maintenance",
            "serial": "SAW-003-2022",
            "location": "Maintenance Shop"
        }
    ]
    
    # Insert materials
    materials_inserted = 0
    for material_data in sample_materials:
        material = Material(**material_data)
        material.qr_code = f"MAT-{material.id[:8]}"
        await db.materials.insert_one(material.model_dump())
        materials_inserted += 1
    
    # Insert tools
    tools_inserted = 0
    for tool_data in sample_tools:
        tool = Tool(**tool_data)
        tool.qr_code = f"TOOL-{tool.id[:8]}"
        await db.tools.insert_one(tool.model_dump())
        tools_inserted += 1
    
    return {
        "message": "Database seeded successfully",
        "materials": materials_inserted,
        "tools": tools_inserted
    }


# -----------------------------------------------------------------------------
# Include router
# -----------------------------------------------------------------------------
app.include_router(api_router)

# Optional: local dev entrypoint (Render ignores this)
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))

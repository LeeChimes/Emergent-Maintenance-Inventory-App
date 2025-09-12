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
ALLOW_LEGACY_LOGIN = os.getenv("ALLOW_LEGACY_LOGIN", "false").lower() == "true"

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


def validate_pin(pin: str) -> bool:
    """Validate that PIN is exactly 4 digits"""
    return isinstance(pin, str) and len(pin) == 4 and pin.isdigit()


# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
class UserRole(str, Enum):
    supervisor = "supervisor"
    engineer = "engineer"


class LoginRequest(BaseModel):
    user_id: str
    pin: str


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
# Inventory Models
# -----------------------------------------------------------------------------
class ToolCondition(str, Enum):
    good = "good"
    fair = "fair"
    poor = "poor"


class TransactionType(str, Enum):
    in_ = "in"
    out = "out"
    adjust = "adjust"


class Material(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    sku: Optional[str] = None
    quantity: int
    min_stock: int
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MaterialCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    quantity: int
    min_stock: int
    location: Optional[str] = None


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    quantity: Optional[int] = None
    min_stock: Optional[int] = None
    location: Optional[str] = None


class Tool(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    condition: ToolCondition
    serial: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ToolCreate(BaseModel):
    name: str
    condition: ToolCondition
    serial: Optional[str] = None
    location: Optional[str] = None


class ToolUpdate(BaseModel):
    name: Optional[str] = None
    condition: Optional[ToolCondition] = None
    serial: Optional[str] = None
    location: Optional[str] = None


class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: TransactionType
    item_type: Literal["material", "tool"]
    item_id: str
    quantity: Optional[int] = None
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
async def create_indexes_and_users():
    if db is None:
        print("ℹ️ Skipping indexes and default user creation; database not connected.")
        return

    try:
        # Create helpful indexes
        await db.users.create_index("id", unique=True)
        await db.materials.create_index("id", unique=True)
        await db.tools.create_index("id", unique=True)
        await db.transactions.create_index([("timestamp", -1)])  # Descending for recent first
        print("✅ Database indexes created")
    except Exception as e:
        print(f"⚠️ Error creating indexes (may already exist): {e}")

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
async def login(request: Optional[LoginRequest] = None, user_id: Optional[str] = None):
    ensure_db()

    # Handle JSON body request (preferred)
    if request is not None:
        # Use JSON body - validate PIN
        user_doc = await db.users.find_one({"id": request.user_id})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify PIN
        if user_doc.get("pin") != request.pin:
            raise HTTPException(status_code=401, detail="Invalid PIN")

        user = User(**user_doc)
        await db.users.update_one(
            {"id": request.user_id},
            {"$set": {"last_login": datetime.utcnow().isoformat()}},
        )

        # Return user without PIN field
        user_dict = user.model_dump()
        user_dict.pop("pin", None)  # Remove PIN from response
        return {"token": user.id, "user": user_dict}

    # Handle query parameter request (backwards compatibility)
    elif user_id is not None:
        if ALLOW_LEGACY_LOGIN:
            # Legacy mode - allow query param without PIN
            user_doc = await db.users.find_one({"id": user_id})
            if not user_doc:
                raise HTTPException(status_code=404, detail="User not found")
            user = User(**user_doc)
            await db.users.update_one(
                {"id": user_id},
                {"$set": {"last_login": datetime.utcnow().isoformat()}},
            )
            # Return user without PIN field
            user_dict = user.model_dump()
            user_dict.pop("pin", None)  # Remove PIN from response
            return {"token": user.id, "user": user_dict}
        else:
            # PIN enforcement is enabled
            raise HTTPException(
                status_code=400,
                detail="PIN authentication is now required. Please update your app and include both user_id and pin in the request body.",
            )

    # Neither JSON body nor query param provided
    else:
        raise HTTPException(
            status_code=400, detail="Either JSON body with user_id and pin, or user_id query parameter is required"
        )


@api_router.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreate):
    ensure_db()

    # Validate PIN
    if not validate_pin(user_data.pin):
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 digits")

    existing_user = await db.users.find_one({"name": user_data.name})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this name already exists")

    user_dict = user_data.model_dump()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["created_at"] = datetime.utcnow().isoformat()
    await db.users.insert_one(user_dict)

    # Return response without PIN
    response_dict = user_dict.copy()
    response_dict.pop("pin", None)
    return UserResponse(**response_dict)


@api_router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate):
    ensure_db()

    # Validate PIN if provided
    if not validate_pin(user_data.pin):
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 digits")

    # Check if user exists first
    existing_user = await db.users.find_one({"id": user_id})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")

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
        raise HTTPException(status_code=404, detail="User not found")

    return {"success": True, "message": "User updated successfully"}


@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    ensure_db()
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


# -----------------------------------------------------------------------------
# Materials routes
# -----------------------------------------------------------------------------
@api_router.get("/materials", response_model=List[Material])
async def list_materials():
    ensure_db()
    materials = await db.materials.find().to_list(1000)
    return [Material(**material) for material in materials]


@api_router.get("/materials/{material_id}", response_model=Material)
async def get_material(material_id: str):
    ensure_db()
    material_doc = await db.materials.find_one({"id": material_id})
    if not material_doc:
        raise HTTPException(status_code=404, detail="Material not found")
    return Material(**material_doc)


@api_router.post("/materials", response_model=Material)
async def create_material(material_data: MaterialCreate):
    ensure_db()
    material_dict = material_data.model_dump()
    material = Material(**material_dict)
    await db.materials.insert_one(material.model_dump())
    return material


@api_router.put("/materials/{material_id}", response_model=Material)
async def update_material(material_id: str, material_data: MaterialUpdate):
    ensure_db()
    update_data = {k: v for k, v in material_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")

    update_data["updated_at"] = datetime.utcnow()
    result = await db.materials.update_one({"id": material_id}, {"$set": update_data})

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")

    updated_material = await db.materials.find_one({"id": material_id})
    return Material(**updated_material)


# -----------------------------------------------------------------------------
# Tools routes
# -----------------------------------------------------------------------------
@api_router.get("/tools", response_model=List[Tool])
async def list_tools():
    ensure_db()
    tools = await db.tools.find().to_list(1000)
    return [Tool(**tool) for tool in tools]


@api_router.get("/tools/{tool_id}", response_model=Tool)
async def get_tool(tool_id: str):
    ensure_db()
    tool_doc = await db.tools.find_one({"id": tool_id})
    if not tool_doc:
        raise HTTPException(status_code=404, detail="Tool not found")
    return Tool(**tool_doc)


@api_router.post("/tools", response_model=Tool)
async def create_tool(tool_data: ToolCreate):
    ensure_db()
    tool_dict = tool_data.model_dump()
    tool = Tool(**tool_dict)
    await db.tools.insert_one(tool.model_dump())
    return tool


@api_router.put("/tools/{tool_id}", response_model=Tool)
async def update_tool(tool_id: str, tool_data: ToolUpdate):
    ensure_db()
    update_data = {k: v for k, v in tool_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")

    update_data["updated_at"] = datetime.utcnow()
    result = await db.tools.update_one({"id": tool_id}, {"$set": update_data})

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tool not found")

    updated_tool = await db.tools.find_one({"id": tool_id})
    return Tool(**updated_tool)


# -----------------------------------------------------------------------------
# Alerts routes
# -----------------------------------------------------------------------------
@api_router.get("/alerts/low-stock")
async def low_stock():
    ensure_db()
    # Find materials where quantity <= min_stock
    low_stock_materials = await db.materials.find({"$expr": {"$lte": ["$quantity", "$min_stock"]}}).to_list(1000)

    materials = [Material(**material) for material in low_stock_materials]
    return {"count": len(materials), "materials": materials}


# -----------------------------------------------------------------------------
# Transactions routes
# -----------------------------------------------------------------------------
@api_router.get("/transactions", response_model=List[Transaction])
async def list_transactions(limit: int = 20):
    ensure_db()
    transactions = await db.transactions.find().sort("timestamp", -1).limit(limit).to_list(limit)
    return [Transaction(**transaction) for transaction in transactions]


@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction_data: TransactionCreate):
    ensure_db()
    transaction_dict = transaction_data.model_dump()
    transaction = Transaction(**transaction_dict)
    await db.transactions.insert_one(transaction.model_dump())
    return transaction


# -----------------------------------------------------------------------------
# Development seed endpoints
# -----------------------------------------------------------------------------
@api_router.post("/dev/seed-basic")
async def seed_basic_data():
    ensure_db()

    # Clear existing data
    await db.materials.delete_many({})
    await db.tools.delete_many({})
    await db.transactions.delete_many({})

    # Seed materials
    sample_materials = [
        {"name": "Safety Helmets", "sku": "SAF-HEL-001", "quantity": 15, "min_stock": 10, "location": "Safety Storage"},
        {"name": "Steel Bolts M8", "sku": "BOL-STL-M8", "quantity": 5, "min_stock": 20, "location": "Hardware Bin A"},
        {
            "name": "LED Work Lights",
            "sku": "LED-WRK-002",
            "quantity": 8,
            "min_stock": 5,
            "location": "Electrical Storage",
        },
        {
            "name": "Heavy Duty Gloves",
            "sku": "GLV-HD-001",
            "quantity": 25,
            "min_stock": 15,
            "location": "Safety Storage",
        },
    ]

    created_materials = []
    for mat_data in sample_materials:
        material = Material(**mat_data)
        await db.materials.insert_one(material.model_dump())
        created_materials.append(material)

    # Seed tools
    sample_tools = [
        {"name": "Impact Drill", "condition": "good", "serial": "DRL-001-2023", "location": "Tool Room A"},
        {
            "name": "Digital Multimeter",
            "condition": "excellent",
            "serial": "DMM-005-2024",
            "location": "Electronics Bay",
        },
        {"name": "Torque Wrench", "condition": "fair", "serial": "TW-003-2022", "location": "Tool Room B"},
        {"name": "Angle Grinder", "condition": "poor", "serial": "AG-007-2021", "location": "Repair Shop"},
    ]

    created_tools = []
    for tool_data in sample_tools:
        tool = Tool(**tool_data)
        await db.tools.insert_one(tool.model_dump())
        created_tools.append(tool)

    # Seed some transactions
    sample_transactions = [
        {
            "type": "out",
            "item_type": "material",
            "item_id": created_materials[0].id,
            "quantity": 3,
            "note": "Used for maintenance job #123",
            "user_id": "lee_carter",
        },
        {
            "type": "in",
            "item_type": "material",
            "item_id": created_materials[1].id,
            "quantity": 50,
            "note": "New shipment received",
            "user_id": "dan_carter",
        },
        {
            "type": "out",
            "item_type": "tool",
            "item_id": created_tools[0].id,
            "note": "Checked out for equipment repair",
            "user_id": "lee_paull",
        },
    ]

    created_transactions = []
    for trans_data in sample_transactions:
        transaction = Transaction(**trans_data)
        await db.transactions.insert_one(transaction.model_dump())
        created_transactions.append(transaction)

    print(
        f"✅ Seeded {len(created_materials)} materials, {len(created_tools)} tools, {len(created_transactions)} transactions"
    )

    return {
        "message": "Basic seed data created successfully",
        "materials_count": len(created_materials),
        "tools_count": len(created_tools),
        "transactions_count": len(created_transactions),
    }


@api_router.get("/dev/seed-basic")
async def seed_basic_data_browser_friendly():
    """Browser-friendly GET version of seed endpoint"""
    return await seed_basic_data()


# -----------------------------------------------------------------------------
# AI Chat endpoint
# -----------------------------------------------------------------------------
class AIChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List] = None


@api_router.post("/ai-chat")
async def ai_chat(request: AIChatRequest):
    """AI Chat endpoint - deterministic stub with helpful guidance"""
    message = request.message.lower()

    # Keywords and responses
    if "dashboard" in message:
        response = "📊 **Dashboard Help**: Your dashboard shows key metrics like total materials, tools, low stock alerts, and today's transactions. Use the health score to monitor inventory status. Quick actions are available for common tasks like inventory checks and stock takes."
    elif "deliveries" in message or "delivery" in message:
        response = "📦 **Deliveries Help**: To manage deliveries: 1) Create new deliveries from suppliers, 2) Process delivery notes with AI scanning, 3) Confirm items received and update inventory automatically. Check delivery status and history in the deliveries section."
    elif "scanner" in message or "scan" in message:
        response = "📱 **Scanner Help**: Use the QR scanner to: 1) Quickly find materials/tools by scanning their QR codes, 2) Perform stock takes efficiently, 3) Check item details instantly. Ensure good lighting and steady hands for best results."
    elif "inventory" in message:
        response = "📋 **Inventory Help**: Manage your inventory by: 1) Adding new materials and tools, 2) Updating quantities and conditions, 3) Setting reorder points for low stock alerts, 4) Performing regular stock takes, 5) Viewing transaction history."
    elif "stock take" in message or "stocktake" in message:
        response = "✅ **Stock Take Help**: Perform stock takes by: 1) Go to Stock Take section, 2) Scan items or search manually, 3) Enter actual quantities found, 4) Review discrepancies, 5) Save to update inventory records automatically."
    elif "suppliers" in message or "supplier" in message:
        response = "🏪 **Suppliers Help**: Manage suppliers by: 1) Adding supplier contact details, 2) Linking products to suppliers, 3) Creating purchase orders, 4) Tracking delivery performance, 5) Using AI to scan supplier catalogs for new products."
    else:
        response = "👋 **General Help**: I'm here to help with the Chimes Shopping Centre maintenance inventory system! I can provide guidance on: Dashboard navigation, Inventory management, QR scanning, Stock takes, Suppliers, and Deliveries. Ask me about any specific feature!"

    return {"response": response}


# -----------------------------------------------------------------------------
# Error Reporting endpoint
# -----------------------------------------------------------------------------
@api_router.post("/error-reports")
async def create_error_report(error_report: dict):
    """Store error reports from the frontend"""
    ensure_db()

    # Add timestamp and store in database
    error_report["created_at"] = datetime.utcnow().isoformat()
    await db.error_reports.insert_one(error_report)

    return {
        "status": "received",
        "estimated_fix_time": "24-72 hours",
        "support_message": "Thanks—our team will investigate and update you.",
    }


# -----------------------------------------------------------------------------
# Include router
# -----------------------------------------------------------------------------
app.include_router(api_router)

# Optional: local dev entrypoint (Render ignores this)
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))

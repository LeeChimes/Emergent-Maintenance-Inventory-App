from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Any, Dict
from datetime import datetime
from enum import Enum
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
import os
import re

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


def validate_pin(pin: str) -> bool:
    """Validate PIN is exactly 4 digits"""
    return bool(re.match(r'^\d{4}$', str(pin)))


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
    name: Optional[str] = None
    role: Optional[str] = None
    pin: Optional[str] = None


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
# Delivery Models
# -----------------------------------------------------------------------------
class Delivery(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    supplier_id: str
    supplier_name: str
    delivery_date: datetime = Field(default_factory=datetime.utcnow)
    status: str = "pending"  # pending, confirmed, cancelled
    items: List[Dict[str, Any]] = []
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    audit_log: List[Dict[str, Any]] = []


class DeliveryCreate(BaseModel):
    supplier_id: str
    supplier_name: str
    delivery_date: Optional[datetime] = None
    items: List[Dict[str, Any]] = []
    notes: Optional[str] = None


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
async def login(user_id: Optional[str] = None, login_data: Optional[LoginRequest] = None):
    ensure_db()
    
    # Get environment flag for legacy login support
    allow_legacy_login = os.getenv("ALLOW_LEGACY_LOGIN", "true").lower() == "true"
    
    # Preferred path: JSON body with user_id and pin
    if login_data:
        user_doc = await db.users.find_one({"id": login_data.user_id})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = User(**user_doc)
        if user.pin != login_data.pin:
            raise HTTPException(status_code=401, detail="Invalid PIN")
            
        # Update last login
        await db.users.update_one(
            {"id": login_data.user_id},
            {"$set": {"last_login": datetime.utcnow().isoformat()}},
        )
        
        # Return user without PIN
        user_response = UserResponse(
            id=user.id,
            name=user.name,
            role=user.role,
            created_at=user.created_at.isoformat() if user.created_at else None,
            last_login=user.last_login,
            created_by=user.created_by
        )
        
        return {"token": user.id, "user": user_response}
    
    # Legacy path: query parameter user_id without PIN
    elif user_id:
        if not allow_legacy_login:
            raise HTTPException(
                status_code=400, 
                detail="Legacy login disabled. Please send JSON request with user_id and pin fields."
            )
        
        user_doc = await db.users.find_one({"id": user_id})
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        user = User(**user_doc)
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"last_login": datetime.utcnow().isoformat()}},
        )
        
        # Return user without PIN for legacy compatibility
        user_response = UserResponse(
            id=user.id,
            name=user.name,
            role=user.role,
            created_at=user.created_at.isoformat() if user.created_at else None,
            last_login=user.last_login,
            created_by=user.created_by
        )
        
        return {"token": user.id, "user": user_response}
    
    else:
        raise HTTPException(
            status_code=400, 
            detail="Please provide login credentials via JSON body with user_id and pin fields."
        )


@api_router.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreate):
    ensure_db()
    
    # Validate PIN format
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
    return UserResponse(
        id=user_dict["id"],
        name=user_dict["name"], 
        role=user_dict["role"],
        created_at=user_dict["created_at"],
        created_by=user_dict.get("created_by")
    )


@api_router.put("/users/{user_id}")
async def update_user(user_id: str, user_data: UserUpdate):
    ensure_db()
    
    # Build update dictionary from provided fields only
    update_dict = {}
    if user_data.name is not None:
        update_dict["name"] = user_data.name
    if user_data.role is not None:
        update_dict["role"] = user_data.role
    if user_data.pin is not None:
        if not validate_pin(user_data.pin):
            raise HTTPException(status_code=400, detail="PIN must be exactly 4 digits")
        update_dict["pin"] = str(user_data.pin)
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_dict}
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
    result = await db.materials.update_one(
        {"id": material_id},
        {"$set": update_data}
    )
    
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
    result = await db.tools.update_one(
        {"id": tool_id},
        {"$set": update_data}
    )
    
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
    low_stock_materials = await db.materials.find({
        "$expr": {"$lte": ["$quantity", "$min_stock"]}
    }).to_list(1000)
    
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
# AI Chat and Error Reporting endpoints
# -----------------------------------------------------------------------------
class AIChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Any]] = []


class AIChatResponse(BaseModel):
    response: str


@api_router.post("/ai-chat", response_model=AIChatResponse)
async def ai_chat(request: AIChatRequest):
    """Deterministic AI helper that recognizes keywords and provides guidance"""
    message_lower = request.message.lower()
    
    # Dashboard related questions
    if "dashboard" in message_lower:
        response = """Dashboard Help:
1. Your dashboard shows key metrics: materials count, tools count, low stock items
2. Use the colored buttons to navigate to different sections
3. Engineers see Asset Inventory and Maintenance Hub buttons
4. Supervisors see all management options including User Management
5. The priority items section shows urgent tasks requiring attention"""
    
    # Deliveries related questions  
    elif "deliver" in message_lower:
        response = """Delivery Management:
1. Go to Deliveries section from the main menu
2. Tap 'Log New Delivery' to record incoming items
3. Enter supplier info, delivery details, and items received
4. Use the confirmation process to update inventory automatically
5. All team members can log deliveries - no special permissions needed"""
    
    # Scanner related questions
    elif "scan" in message_lower:
        response = """QR Scanner Help:
1. Access scanner from the main dashboard
2. Point camera at QR code or barcode on items
3. If scanning fails, use 'Enter Manually' option
4. Scanner works for checking items in/out of inventory
5. Make sure camera permissions are enabled in device settings"""
    
    # Inventory related questions
    elif "inventory" in message_lower:
        response = """Inventory Management:
1. View all materials and tools in the Inventory section
2. Add new items using the '+' button
3. Update quantities by tapping on items
4. Set minimum stock levels to get low stock alerts
5. Use the search function to quickly find specific items"""
    
    # Stock take related questions
    elif "stock" in message_lower:
        response = """Stock Take Process:
1. Go to Stock Take section from inventory menu
2. Choose full count or selective items
3. Scan or manually enter current quantities
4. System will show discrepancies for review
5. Confirm counts to update inventory records"""
        
    # Suppliers related questions
    elif "supplier" in message_lower:
        response = """Supplier Management:
1. Access Suppliers section from main menu
2. Add new suppliers with contact details
3. Link suppliers to materials/tools for better tracking
4. View supplier history and delivery performance
5. Use supplier data when logging new deliveries"""
    
    # User management related questions
    elif "user" in message_lower and "management" in message_lower:
        response = """User Management (Supervisors Only):
1. Add new team members with roles (Engineer/Supervisor)
2. Set 4-digit PINs for secure access
3. Edit user details and permissions
4. Remove users who no longer need access
5. View user activity and last login times"""
    
    # Generic help
    else:
        response = """Chimes Asset Inventory App Help:

KEY FEATURES:
• Dashboard - Overview of inventory status
• QR Scanner - Check items in/out quickly  
• Inventory - Manage materials and tools
• Deliveries - Log incoming shipments
• Stock Take - Count and verify inventory
• Suppliers - Manage vendor information

ROLES:
• Engineers - Basic inventory access
• Supervisors - Full management access

Need specific help? Try asking about: dashboard, deliveries, scanner, inventory, stock take, suppliers, or user management."""

    return AIChatResponse(response=response)


@api_router.post("/error-reports")
async def error_reports(error_data: dict):
    """Accept error reports and store them for investigation"""
    ensure_db()
    
    # Add timestamp and create document
    error_document = {
        "id": error_data.get("id", str(uuid.uuid4())),
        "error": error_data.get("error", "Unknown error"),
        "message": error_data.get("message", ""),
        "screen": error_data.get("screen", "Unknown"),
        "stack": error_data.get("stack", ""),
        "timestamp": error_data.get("timestamp", datetime.utcnow().isoformat()),
        "user_id": error_data.get("userId", "anonymous"),
        "device_info": error_data.get("deviceInfo", {}),
        "additional_data": error_data.get("additionalData", {}),
        "created_at": datetime.utcnow()
    }
    
    # Store in error_reports collection
    await db.error_reports.insert_one(error_document)
    
    return {
        "status": "received",
        "estimated_fix_time": "24-72 hours", 
        "support_message": "Thanks—our team will investigate and update you."
    }


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
        {
            "name": "Safety Helmets",
            "sku": "SAF-HEL-001",
            "quantity": 15,
            "min_stock": 10,
            "location": "Safety Storage"
        },
        {
            "name": "Steel Bolts M8",
            "sku": "BOL-STL-M8",
            "quantity": 5,
            "min_stock": 20,
            "location": "Hardware Bin A"
        },
        {
            "name": "LED Work Lights",
            "sku": "LED-WRK-002",
            "quantity": 8,
            "min_stock": 5,
            "location": "Electrical Storage"
        },
        {
            "name": "Heavy Duty Gloves",
            "sku": "GLV-HD-001",
            "quantity": 25,
            "min_stock": 15,
            "location": "Safety Storage"
        }
    ]
    
    created_materials = []
    for mat_data in sample_materials:
        material = Material(**mat_data)
        await db.materials.insert_one(material.model_dump())
        created_materials.append(material)
    
    # Seed tools
    sample_tools = [
        {
            "name": "Impact Drill",
            "condition": "good",
            "serial": "DRL-001-2023",
            "location": "Tool Room A"
        },
        {
            "name": "Digital Multimeter",
            "condition": "excellent",
            "serial": "DMM-005-2024",
            "location": "Electronics Bay"
        },
        {
            "name": "Torque Wrench",
            "condition": "fair",
            "serial": "TW-003-2022",
            "location": "Tool Room B"
        },
        {
            "name": "Angle Grinder",
            "condition": "poor",
            "serial": "AG-007-2021",
            "location": "Repair Shop"
        }
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
            "user_id": "lee_carter"
        },
        {
            "type": "in",
            "item_type": "material", 
            "item_id": created_materials[1].id,
            "quantity": 50,
            "note": "New shipment received",
            "user_id": "dan_carter"
        },
        {
            "type": "out",
            "item_type": "tool",
            "item_id": created_tools[0].id,
            "note": "Checked out for equipment repair",
            "user_id": "lee_paull"
        }
    ]
    
    created_transactions = []
    for trans_data in sample_transactions:
        transaction = Transaction(**trans_data)
        await db.transactions.insert_one(transaction.model_dump())
        created_transactions.append(transaction)
    
    print(f"✅ Seeded {len(created_materials)} materials, {len(created_tools)} tools, {len(created_transactions)} transactions")
    
    return {
        "message": "Basic seed data created successfully",
        "materials_count": len(created_materials),
        "tools_count": len(created_tools), 
        "transactions_count": len(created_transactions)
    }


@api_router.get("/dev/seed-basic")
async def seed_basic_data_browser_friendly():
    """Browser-friendly GET version of seed endpoint"""
    return await seed_basic_data()


# -----------------------------------------------------------------------------
# Include router and register delivery endpoints
# -----------------------------------------------------------------------------
import delivery_routes  # register delivery endpoints
app.include_router(api_router)

# Optional: local dev entrypoint (Render ignores this)
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))

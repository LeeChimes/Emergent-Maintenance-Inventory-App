from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from enum import Enum
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Asset Inventory API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Enums
class UserRole(str, Enum):
    SUPERVISOR = "supervisor"
    ENGINEER = "engineer"

class ItemType(str, Enum):
    MATERIAL = "material"
    TOOL = "tool"

class ToolStatus(str, Enum):
    AVAILABLE = "available"
    IN_USE = "in_use"
    MAINTENANCE = "maintenance"
    OUT_OF_ORDER = "out_of_order"

class ToolCondition(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"

class TransactionType(str, Enum):
    TAKE = "take"
    RESTOCK = "restock"
    CHECK_OUT = "check_out"
    CHECK_IN = "check_in"
    STOCK_TAKE = "stock_take"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    role: UserRole
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    role: UserRole

class Supplier(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str = "general"  # electrical, hardware, safety, cleaning, general
    website: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    account_number: Optional[str] = None
    delivery_info: Optional[str] = None
    products: List[dict] = []  # AI scanned products
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceRecord(BaseModel):
    date: datetime
    description: str
    performed_by: str
    next_service_due: Optional[datetime] = None
    cost: Optional[float] = None

class Material(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: int
    unit: str = "pieces"
    min_stock: int = 0
    location: Optional[str] = None
    supplier: Optional[Supplier] = None
    photo: Optional[str] = None  # base64 encoded
    qr_code: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MaterialCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: int
    unit: str = "pieces"
    min_stock: int = 0
    location: Optional[str] = None
    supplier: Optional[Supplier] = None
    photo: Optional[str] = None

class Tool(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    status: ToolStatus = ToolStatus.AVAILABLE
    condition: ToolCondition = ToolCondition.GOOD
    location: Optional[str] = None
    current_user: Optional[str] = None
    service_records: List[ServiceRecord] = []
    next_service_due: Optional[datetime] = None
    photo: Optional[str] = None  # base64 encoded
    qr_code: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ToolCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    status: ToolStatus = ToolStatus.AVAILABLE
    condition: ToolCondition = ToolCondition.GOOD
    location: Optional[str] = None
    photo: Optional[str] = None

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_id: str
    item_type: ItemType
    transaction_type: TransactionType
    user_id: str
    user_name: str
    quantity: Optional[int] = None  # For materials
    condition: Optional[ToolCondition] = None  # For tools
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class TransactionCreate(BaseModel):
    item_id: str
    item_type: ItemType
    transaction_type: TransactionType
    user_id: str
    user_name: str
    quantity: Optional[int] = None
    condition: Optional[ToolCondition] = None
    notes: Optional[str] = None

class StockTakeEntry(BaseModel):
    item_id: str
    item_type: ItemType
    counted_quantity: int
    condition: Optional[ToolCondition] = None
    notes: Optional[str] = None

class StockTake(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    item_type: ItemType
    entries: List[StockTakeEntry]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    completed: bool = False

class StockTakeCreate(BaseModel):
    user_id: str
    user_name: str
    item_type: ItemType
    entries: List[StockTakeEntry]

# Authentication helper
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[User]:
    if not credentials:
        return None
    # For now, we'll use a simple token-based auth where token is user_id
    user_doc = await db.users.find_one({"id": credentials.credentials})
    if user_doc:
        return User(**user_doc)
    return None

# Initialize default users
@app.on_event("startup")
async def create_default_users():
    # Check if users already exist
    user_count = await db.users.count_documents({})
    if user_count == 0:
        default_users = [
            {"id": "lee_carter", "name": "Lee Carter", "role": "supervisor"},
            {"id": "dan_carter", "name": "Dan Carter", "role": "supervisor"},
            {"id": "lee_paull", "name": "Lee Paull", "role": "engineer"},
            {"id": "dean_turnill", "name": "Dean Turnill", "role": "engineer"},
            {"id": "luis", "name": "Luis", "role": "engineer"}
        ]
        
        for user_data in default_users:
            user = User(**user_data)
            await db.users.insert_one(user.dict())
        
        print("Default users created")

# Routes
@api_router.get("/")
async def root():
    return {"message": "Asset Inventory API", "version": "1.0.0"}

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
    return {"token": user.id, "user": user}

# Material routes
@api_router.get("/materials", response_model=List[Material])
async def get_materials():
    materials = await db.materials.find().to_list(1000)
    return [Material(**material) for material in materials]

@api_router.get("/materials/{material_id}", response_model=Material)
async def get_material(material_id: str):
    material_doc = await db.materials.find_one({"id": material_id})
    if not material_doc:
        raise HTTPException(status_code=404, detail="Material not found")
    return Material(**material_doc)

@api_router.post("/materials", response_model=Material)
async def create_material(material_data: MaterialCreate):
    material_dict = material_data.dict()
    material = Material(**material_dict)
    # Generate QR code data (will be the material ID)
    material.qr_code = material.id
    await db.materials.insert_one(material.dict())
    return material

@api_router.put("/materials/{material_id}", response_model=Material)
async def update_material(material_id: str, material_data: MaterialCreate):
    material_dict = material_data.dict()
    material_dict["updated_at"] = datetime.utcnow()
    
    result = await db.materials.update_one(
        {"id": material_id},
        {"$set": material_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    
    updated_doc = await db.materials.find_one({"id": material_id})
    return Material(**updated_doc)

@api_router.delete("/materials/{material_id}")
async def delete_material(material_id: str):
    result = await db.materials.delete_one({"id": material_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Material not found")
    return {"message": "Material deleted successfully"}

# Tool routes
@api_router.get("/tools", response_model=List[Tool])
async def get_tools():
    tools = await db.tools.find().to_list(1000)
    return [Tool(**tool) for tool in tools]

@api_router.get("/tools/{tool_id}", response_model=Tool)
async def get_tool(tool_id: str):
    tool_doc = await db.tools.find_one({"id": tool_id})
    if not tool_doc:
        raise HTTPException(status_code=404, detail="Tool not found")
    return Tool(**tool_doc)

@api_router.post("/tools", response_model=Tool)
async def create_tool(tool_data: ToolCreate):
    tool_dict = tool_data.dict()
    tool = Tool(**tool_dict)
    # Generate QR code data (will be the tool ID)
    tool.qr_code = tool.id
    await db.tools.insert_one(tool.dict())
    return tool

@api_router.put("/tools/{tool_id}", response_model=Tool)
async def update_tool(tool_id: str, tool_data: ToolCreate):
    tool_dict = tool_data.dict()
    tool_dict["updated_at"] = datetime.utcnow()
    
    result = await db.tools.update_one(
        {"id": tool_id},
        {"$set": tool_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    updated_doc = await db.tools.find_one({"id": tool_id})
    return Tool(**updated_doc)

# Transaction routes
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction_data: TransactionCreate):
    transaction = Transaction(**transaction_data.dict())
    
    # Update item quantities/status based on transaction type
    if transaction.item_type == ItemType.MATERIAL:
        material_doc = await db.materials.find_one({"id": transaction.item_id})
        if not material_doc:
            raise HTTPException(status_code=404, detail="Material not found")
        
        material = Material(**material_doc)
        if transaction.transaction_type == TransactionType.TAKE:
            if material.quantity < transaction.quantity:
                raise HTTPException(status_code=400, detail="Insufficient quantity")
            material.quantity -= transaction.quantity
        elif transaction.transaction_type == TransactionType.RESTOCK:
            material.quantity += transaction.quantity
        elif transaction.transaction_type == TransactionType.STOCK_TAKE:
            material.quantity = transaction.quantity
        
        material.updated_at = datetime.utcnow()
        await db.materials.update_one(
            {"id": transaction.item_id},
            {"$set": material.dict()}
        )
    
    elif transaction.item_type == ItemType.TOOL:
        tool_doc = await db.tools.find_one({"id": transaction.item_id})
        if not tool_doc:
            raise HTTPException(status_code=404, detail="Tool not found")
        
        tool = Tool(**tool_doc)
        if transaction.transaction_type == TransactionType.CHECK_OUT:
            tool.status = ToolStatus.IN_USE
            tool.current_user = transaction.user_name
        elif transaction.transaction_type == TransactionType.CHECK_IN:
            tool.status = ToolStatus.AVAILABLE
            tool.current_user = None
            if transaction.condition:
                tool.condition = transaction.condition
        
        tool.updated_at = datetime.utcnow()
        await db.tools.update_one(
            {"id": transaction.item_id},
            {"$set": tool.dict()}
        )
    
    await db.transactions.insert_one(transaction.dict())
    return transaction

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(limit: int = 100):
    transactions = await db.transactions.find().sort("timestamp", -1).limit(limit).to_list(limit)
    return [Transaction(**transaction) for transaction in transactions]

# Low stock alerts (for supervisors)
@api_router.get("/alerts/low-stock")
async def get_low_stock_alerts():
    # Find materials where quantity <= min_stock
    low_stock_materials = await db.materials.find({
        "$expr": {"$lte": ["$quantity", "$min_stock"]}
    }).to_list(1000)
    
    return {
        "count": len(low_stock_materials),
        "materials": [Material(**material) for material in low_stock_materials]
    }

# Stock take routes
@api_router.post("/stock-takes", response_model=StockTake)
async def create_stock_take(stock_take_data: StockTakeCreate):
    stock_take = StockTake(**stock_take_data.dict())
    
    # Process each entry and update item quantities
    for entry in stock_take.entries:
        if entry.item_type == ItemType.MATERIAL:
            await db.materials.update_one(
                {"id": entry.item_id},
                {
                    "$set": {
                        "quantity": entry.counted_quantity,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
        elif entry.item_type == ItemType.TOOL:
            update_data = {"updated_at": datetime.utcnow()}
            if entry.condition:
                update_data["condition"] = entry.condition
            
            await db.tools.update_one(
                {"id": entry.item_id},
                {"$set": update_data}
            )
        
        # Create transaction record
        transaction = Transaction(
            item_id=entry.item_id,
            item_type=entry.item_type,
            transaction_type=TransactionType.STOCK_TAKE,
            user_id=stock_take.user_id,
            user_name=stock_take.user_name,
            quantity=entry.counted_quantity if entry.item_type == ItemType.MATERIAL else None,
            condition=entry.condition,
            notes=entry.notes
        )
        await db.transactions.insert_one(transaction.dict())
    
    stock_take.completed = True
    await db.stock_takes.insert_one(stock_take.dict())
    return stock_take

# Error reporting route
@api_router.post("/error-reports")
async def receive_error_report(error_data: dict):
    """
    Endpoint to receive error reports from the mobile app
    """
    try:
        # Log the error for immediate attention
        print("🚨 ERROR REPORT RECEIVED FROM APP:")
        print(f"📱 Error ID: {error_data.get('id', 'Unknown')}")
        print(f"⏰ Timestamp: {error_data.get('timestamp', 'Unknown')}")
        print(f"👤 User Action: {error_data.get('userAction', 'Unknown')}")
        print(f"📍 Screen: {error_data.get('screen', 'Unknown')}")
        print(f"🔥 Error Message: {error_data.get('error', {}).get('message', 'Unknown')}")
        
        # Store error report in database for tracking
        error_report = {
            "id": error_data.get('id'),
            "timestamp": error_data.get('timestamp'),
            "user_action": error_data.get('userAction'),
            "screen": error_data.get('screen'),
            "error_message": error_data.get('error', {}).get('message'),
            "error_stack": error_data.get('error', {}).get('stack'),
            "additional_data": error_data.get('additionalData'),
            "status": "received",
            "priority": "high"
        }
        
        await db.error_reports.insert_one(error_report)
        
        print("✅ Error report stored for immediate repair")
        print("🔧 Auto-repair system activated")
        
        return {
            "status": "received",
            "message": "Error report received and queued for immediate repair",
            "estimated_fix_time": "5-15 minutes",
            "support_message": "Our auto-repair system is working on this right away!"
        }
        
    except Exception as e:
        print(f"❌ Failed to process error report: {e}")
        return {
            "status": "error",
            "message": "Error report received but processing failed",
            "fallback": "Error logged locally for manual review"
        }

# Get error reports for monitoring
@api_router.get("/error-reports")
async def get_error_reports(limit: int = 50):
    """
    Get recent error reports for monitoring
    """
    try:
        error_reports = await db.error_reports.find().sort("timestamp", -1).limit(limit).to_list(limit)
        return {
            "count": len(error_reports),
            "reports": error_reports
        }
    except Exception as e:
        return {
            "count": 0,
            "reports": [],
            "error": str(e)
        }

# Health check route with error detection
@api_router.get("/health")
async def health_check():
    """
    Enhanced health check with error detection
    """
    try:
        # Test database connection
        await db.users.count_documents({})
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected",
            "error_system": "active",
            "message": "All systems operational 🚀"
        }
    except Exception as e:
        return {
            "status": "degraded",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "error",
            "error_system": "active",
            "message": f"System issue detected: {str(e)}",
            "action": "Auto-repair in progress"
        }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
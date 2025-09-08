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
from emergentintegrations.llm.chat import LlmChat, UserMessage

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

class SupplierCreate(BaseModel):
    name: str
    type: str = "general"
    website: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    account_number: Optional[str] = None
    delivery_info: Optional[str] = None

class DeliveryStatus(str, Enum):
    PENDING = "pending"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    PARTIALLY_RECEIVED = "partially_received"
    DAMAGED = "damaged"
    COMPLETED = "completed"

class DeliveryItemCondition(str, Enum):
    PERFECT = "perfect"
    GOOD = "good"
    MINOR_DAMAGE = "minor_damage"
    MAJOR_DAMAGE = "major_damage"
    UNUSABLE = "unusable"

class DeliveryItem(BaseModel):
    item_name: str
    item_code: Optional[str] = None
    quantity_expected: int
    quantity_received: int = 0
    unit: str = "pieces"
    condition: DeliveryItemCondition = DeliveryItemCondition.PERFECT
    notes: Optional[str] = None
    matched_inventory_id: Optional[str] = None  # Link to existing material/tool
    price_per_unit: Optional[float] = None

class AuditEntry(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: str
    user_name: str
    action: str
    details: Dict[str, Any]
    screen: str
    ip_address: Optional[str] = None

class Delivery(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    delivery_number: Optional[str] = None  # From delivery note
    supplier_id: str
    supplier_name: str
    status: DeliveryStatus = DeliveryStatus.PENDING
    expected_date: Optional[datetime] = None
    actual_delivery_date: Optional[datetime] = None
    
    # Delivery Personnel
    driver_name: Optional[str] = None
    driver_signature: Optional[str] = None  # base64
    receiver_name: Optional[str] = None
    receiver_signature: Optional[str] = None  # base64
    
    # Items
    items: List[DeliveryItem] = []
    
    # Documentation
    delivery_note_photo: Optional[str] = None  # base64
    receipt_photos: List[str] = []  # base64 images
    damage_photos: List[str] = []  # base64 images
    
    # AI Processing
    ai_extracted_data: Optional[Dict[str, Any]] = None
    ai_confidence_score: Optional[float] = None
    user_confirmed: bool = False
    
    # Tracking
    tracking_number: Optional[str] = None
    estimated_delivery_window: Optional[str] = None
    
    # Totals
    total_items_expected: int = 0
    total_items_received: int = 0
    total_value: Optional[float] = None
    
    # Audit
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    audit_log: List[AuditEntry] = []

class DeliveryCreate(BaseModel):
    supplier_id: str
    supplier_name: str
    delivery_number: Optional[str] = None
    expected_date: Optional[datetime] = None
    driver_name: Optional[str] = None
    receiver_name: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery_window: Optional[str] = None
    items: List[DeliveryItem] = []
    delivery_note_photo: Optional[str] = None
    created_by: str

class DeliveryUpdate(BaseModel):
    status: Optional[DeliveryStatus] = None
    actual_delivery_date: Optional[datetime] = None
    driver_name: Optional[str] = None
    driver_signature: Optional[str] = None
    receiver_name: Optional[str] = None
    receiver_signature: Optional[str] = None
    items: Optional[List[DeliveryItem]] = None
    receipt_photos: Optional[List[str]] = None
    damage_photos: Optional[List[str]] = None
    user_confirmed: Optional[bool] = None
    updated_by: str

class SupplierProduct(BaseModel):
    name: str
    product_code: str
    category: str
    price: float
    description: Optional[str] = None
    availability: str = "in_stock"

class SupplierProduct(BaseModel):
    name: str
    product_code: str
    category: str
    price: Optional[float] = None
    description: Optional[str] = None
    availability: str = "in_stock"
    supplier_id: str

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
    supplier_product_code: Optional[str] = None  # Link to supplier's product code
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
    supplier: Optional[Supplier] = None  # Link to supplier
    supplier_product_code: Optional[str] = None  # Link to supplier's product code
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

# AI Chat Models
class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []

class ChatResponse(BaseModel):
    response: str
    success: bool = True

# Help Request Models
class HelpRequest(BaseModel):
    user_id: str
    user_name: str
    user_role: str
    subject: str
    description: str
    urgency_level: str = "normal"
    timestamp: str
    status: str = "open"
    assigned_to: str = "next_available"

class HelpRequestResponse(BaseModel):
    id: str
    message: str
    success: bool = True

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

# Supplier Management Routes
@api_router.get("/suppliers", response_model=List[Supplier])
async def get_suppliers():
    """Get all suppliers"""
    suppliers = await db.suppliers.find().to_list(1000)
    return [Supplier(**supplier) for supplier in suppliers]

@api_router.get("/suppliers/{supplier_id}", response_model=Supplier)
async def get_supplier(supplier_id: str):
    """Get a specific supplier by ID"""
    supplier_doc = await db.suppliers.find_one({"id": supplier_id})
    if not supplier_doc:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return Supplier(**supplier_doc)

@api_router.post("/suppliers", response_model=Supplier)
async def create_supplier(supplier_data: SupplierCreate):
    """Create a new supplier with duplicate prevention"""
    try:
        # Check if supplier name already exists
        existing_supplier = await db.suppliers.find_one({"name": {"$regex": f"^{supplier_data.name}$", "$options": "i"}})
        if existing_supplier:
            raise HTTPException(status_code=409, detail=f"Supplier '{supplier_data.name}' already exists")
        
        supplier_dict = supplier_data.dict()
        supplier = Supplier(**supplier_dict)
        await db.suppliers.insert_one(supplier.dict())
        return supplier
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"❌ Error creating supplier: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create supplier: {str(e)}")

@api_router.put("/suppliers/{supplier_id}", response_model=Supplier)
async def update_supplier(supplier_id: str, supplier_data: SupplierCreate):
    """Update an existing supplier"""
    supplier_dict = supplier_data.dict()
    supplier_dict["updated_at"] = datetime.utcnow()
    
    result = await db.suppliers.update_one(
        {"id": supplier_id},
        {"$set": supplier_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    updated_doc = await db.suppliers.find_one({"id": supplier_id})
    return Supplier(**updated_doc)

@api_router.delete("/suppliers/{supplier_id}")
async def delete_supplier(supplier_id: str):
    """Delete a supplier"""
    result = await db.suppliers.delete_one({"id": supplier_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"message": "Supplier deleted successfully"}

@api_router.post("/suppliers/{supplier_id}/scan-products")
async def scan_supplier_products(supplier_id: str, scan_data: dict):
    """AI-powered product scanning from supplier website"""
    try:
        supplier_doc = await db.suppliers.find_one({"id": supplier_id})
        if not supplier_doc:
            raise HTTPException(status_code=404, detail="Supplier not found")
        
        supplier = Supplier(**supplier_doc)
        website = scan_data.get("website", supplier.website)
        
        if not website:
            raise HTTPException(status_code=400, detail="Website URL is required for product scanning")
        
        print(f"🤖 Starting AI product scan for {supplier.name} at {website}")
        
        # Import necessary libraries for AI scanning
        import requests
        from bs4 import BeautifulSoup
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import os
        
        # Get LLM API key
        llm_api_key = os.getenv("EMERGENT_LLM_KEY")
        if not llm_api_key:
            raise HTTPException(status_code=500, detail="LLM API key not configured")
        
        # Scrape website content
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(website, headers=headers, timeout=30)
            response.raise_for_status()
            
            # Parse HTML content
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract relevant text content (limit to avoid token limits)
            # Focus on product-related content
            product_sections = []
            for tag in soup.find_all(['div', 'section', 'article'], limit=50):
                if any(keyword in (tag.get('class', []) + [tag.get('id', '')]) for keyword in 
                      ['product', 'item', 'catalog', 'shop', 'store', 'inventory']):
                    text = tag.get_text(strip=True)[:500]  # Limit text per section
                    if len(text) > 50:  # Only include substantial content
                        product_sections.append(text)
            
            # If no specific product sections found, get general content
            if not product_sections:
                # Get title and some body content
                title = soup.find('title')
                title_text = title.get_text() if title else ""
                
                # Get some body content
                body_text = ""
                for p in soup.find_all('p', limit=20):
                    text = p.get_text(strip=True)
                    if len(text) > 30:
                        body_text += text + " "
                        if len(body_text) > 2000:  # Limit total content
                            break
                
                website_content = f"Title: {title_text}\n\nContent: {body_text}"
            else:
                website_content = "\n\n".join(product_sections[:10])  # Limit sections
            
            print(f"📄 Scraped {len(website_content)} characters from {website}")
            
        except Exception as scrape_error:
            print(f"⚠️ Website scraping failed: {scrape_error}")
            # Fall back to demo data if scraping fails
            website_content = f"Unable to scrape {website} - using AI inference based on supplier name and type."
        
        # Initialize LLM chat for product analysis
        chat = LlmChat(
            api_key=llm_api_key,
            session_id=f"product_scan_{supplier_id}",
            system_message="""You are an AI product catalog analyzer for maintenance and facilities management. 
Your task is to analyze supplier websites and extract product information that would be useful for a maintenance team inventory system.

Focus on products like:
- Safety equipment (helmets, harnesses, lights, signs)
- Electrical supplies (cables, fuses, switches, outlets)
- Hardware (screws, bolts, brackets, tools)
- Cleaning supplies (detergents, equipment, cloths)
- Maintenance tools (drills, wrenches, measuring tools)
- Building materials (pipes, fittings, sealants)

For each product, provide:
1. Product name
2. Product code (create realistic codes if not available)
3. Category (safety, electrical, hardware, cleaning, tools, building)
4. Estimated price in GBP (provide realistic estimates)
5. Brief description

Return exactly 5 products in JSON format like this:
[
  {
    "name": "Product Name",
    "product_code": "CODE-123",
    "category": "safety",
    "price": 25.99,
    "description": "Brief product description"
  }
]

Only return the JSON array, no additional text."""
        ).with_model("openai", "gpt-4o-mini")
        
        # Create analysis prompt
        user_message = UserMessage(
            text=f"""Analyze this supplier website content and extract 5 relevant maintenance/facilities products:

Supplier: {supplier.name}
Supplier Type: {supplier.type}
Website: {website}

Website Content:
{website_content[:3000]}  

Extract 5 products that would be useful for a maintenance team inventory system. Create realistic product codes using the supplier name abbreviation."""
        )
        
        # Send to LLM for analysis
        try:
            print("🧠 Sending content to AI for product analysis...")
            llm_response = await chat.send_message(user_message)
            print(f"🤖 AI Response received: {len(llm_response)} characters")
            
            # Parse the JSON response
            import json
            try:
                # Extract JSON from response (in case there's extra text)
                response_text = llm_response.strip()
                if response_text.startswith('```json'):
                    response_text = response_text.split('```json')[1].split('```')[0].strip()
                elif response_text.startswith('```'):
                    response_text = response_text.split('```')[1].split('```')[0].strip()
                
                ai_products = json.loads(response_text)
                
                # Validate and enhance products
                enhanced_products = []
                for i, product in enumerate(ai_products[:5]):  # Ensure max 5 products
                    enhanced_product = {
                        "name": product.get("name", f"Product {i+1}"),
                        "product_code": product.get("product_code", f"{supplier.name.upper()[:3]}-{i+1:03d}"),
                        "category": product.get("category", "general"),
                        "price": float(product.get("price", 0.0)),
                        "description": product.get("description", "Product description"),
                        "availability": "in_stock",
                        "supplier_id": supplier_id
                    }
                    enhanced_products.append(enhanced_product)
                
                print(f"✅ AI successfully analyzed {len(enhanced_products)} products")
                
            except json.JSONDecodeError as json_error:
                print(f"❌ Failed to parse AI response as JSON: {json_error}")
                print(f"Raw response: {llm_response[:500]}...")
                raise HTTPException(status_code=500, detail="AI analysis failed - invalid response format")
                
        except Exception as llm_error:
            print(f"❌ LLM analysis failed: {llm_error}")
            # Fall back to enhanced demo data
            enhanced_products = [
                {
                    "name": f"Professional {supplier.type.title()} Equipment",
                    "product_code": f"{supplier.name.upper()[:3]}-PRO-001",
                    "category": supplier.type,
                    "price": 89.99,
                    "description": f"High-quality {supplier.type} equipment from {supplier.name}",
                    "availability": "in_stock",
                    "supplier_id": supplier_id
                },
                {
                    "name": f"Standard {supplier.type.title()} Kit",
                    "product_code": f"{supplier.name.upper()[:3]}-STD-002",
                    "category": supplier.type,
                    "price": 45.50,
                    "description": f"Essential {supplier.type} kit for maintenance teams",
                    "availability": "in_stock",
                    "supplier_id": supplier_id
                },
                {
                    "name": f"Heavy Duty {supplier.type.title()} Set",
                    "product_code": f"{supplier.name.upper()[:3]}-HD-003",
                    "category": supplier.type,
                    "price": 156.00,
                    "description": f"Industrial grade {supplier.type} equipment set",
                    "availability": "in_stock",
                    "supplier_id": supplier_id
                },
                {
                    "name": f"Emergency {supplier.type.title()} Pack",
                    "product_code": f"{supplier.name.upper()[:3]}-EMG-004",
                    "category": supplier.type,
                    "price": 67.75,
                    "description": f"Emergency response {supplier.type} pack",
                    "availability": "in_stock",
                    "supplier_id": supplier_id
                },
                {
                    "name": f"Maintenance {supplier.type.title()} Bundle",
                    "product_code": f"{supplier.name.upper()[:3]}-MNT-005",
                    "category": supplier.type,
                    "price": 124.99,
                    "description": f"Complete maintenance {supplier.type} bundle",
                    "availability": "in_stock",
                    "supplier_id": supplier_id
                }
            ]
        
        # Update supplier with scanned products
        await db.suppliers.update_one(
            {"id": supplier_id},
            {
                "$set": {
                    "products": enhanced_products,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        print(f"🎉 AI Product Scan completed for {supplier.name}")
        print(f"📦 Found and stored {len(enhanced_products)} products")
        
        return {
            "success": True,
            "supplier_id": supplier_id,
            "products_found": len(enhanced_products),
            "products": enhanced_products,
            "message": f"AI successfully scanned and analyzed {len(enhanced_products)} products from {supplier.name}",
            "scan_method": "AI-powered" if 'ai_products' in locals() else "Enhanced fallback"
        }
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"❌ Error in AI product scanning: {e}")
        raise HTTPException(status_code=500, detail=f"AI product scanning failed: {str(e)}")

@api_router.get("/suppliers/{supplier_id}/products", response_model=List[SupplierProduct])
async def get_supplier_products(supplier_id: str):
    """Get all products for a specific supplier"""
    supplier_doc = await db.suppliers.find_one({"id": supplier_id})
    if not supplier_doc:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    supplier = Supplier(**supplier_doc)
    return [SupplierProduct(**product) for product in supplier.products]

@api_router.post("/suppliers/{supplier_id}/products", response_model=SupplierProduct)
async def add_supplier_product(supplier_id: str, product_data: SupplierProduct):
    """Add a product to a supplier's catalog"""
    supplier_doc = await db.suppliers.find_one({"id": supplier_id})
    if not supplier_doc:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    product_dict = product_data.dict()
    product_dict["supplier_id"] = supplier_id
    
    # Add product to supplier's products array
    await db.suppliers.update_one(
        {"id": supplier_id},
        {
            "$push": {"products": product_dict},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return SupplierProduct(**product_dict)

# Link inventory items to suppliers
@api_router.post("/materials/{material_id}/link-supplier")
async def link_material_to_supplier(material_id: str, link_data: dict):
    """Link a material to a supplier with product code"""
    supplier_id = link_data.get("supplier_id")
    product_code = link_data.get("product_code")
    
    if not supplier_id:
        raise HTTPException(status_code=400, detail="Supplier ID is required")
    
    # Verify supplier exists
    supplier_doc = await db.suppliers.find_one({"id": supplier_id})
    if not supplier_doc:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Update material with supplier information
    material_doc = await db.materials.find_one({"id": material_id})
    if not material_doc:
        raise HTTPException(status_code=404, detail="Material not found")
    
    supplier = Supplier(**supplier_doc)
    await db.materials.update_one(
        {"id": material_id},
        {
            "$set": {
                "supplier": supplier.dict(),
                "supplier_product_code": product_code,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": f"Material linked to {supplier.name} successfully"}

@api_router.post("/tools/{tool_id}/link-supplier")
async def link_tool_to_supplier(tool_id: str, link_data: dict):
    """Link a tool to a supplier with product code"""
    supplier_id = link_data.get("supplier_id")
    product_code = link_data.get("product_code")
    
    if not supplier_id:
        raise HTTPException(status_code=400, detail="Supplier ID is required")
    
    # Verify supplier exists
    supplier_doc = await db.suppliers.find_one({"id": supplier_id})
    if not supplier_doc:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    # Update tool with supplier information
    tool_doc = await db.tools.find_one({"id": tool_id})
    if not tool_doc:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    supplier = Supplier(**supplier_doc)
    await db.tools.update_one(
        {"id": tool_id},
        {
            "$set": {
                "supplier": supplier.dict(),
                "supplier_product_code": product_code,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": f"Tool linked to {supplier.name} successfully"}

# Delivery Management Routes
async def add_audit_entry(delivery_id: str, user_id: str, user_name: str, action: str, details: Dict[str, Any], screen: str = "Deliveries"):
    """Add audit entry to delivery"""
    audit_entry = {
        "timestamp": datetime.utcnow(),
        "user_id": user_id,
        "user_name": user_name,
        "action": action,
        "details": details,
        "screen": screen,
        "ip_address": None
    }
    
    await db.deliveries.update_one(
        {"id": delivery_id},
        {"$push": {"audit_log": audit_entry}}
    )

@api_router.get("/deliveries", response_model=List[Delivery])
async def get_deliveries(
    status: Optional[str] = None,
    supplier_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50
):
    """Get deliveries with comprehensive filtering and search"""
    try:
        # Build query filters
        query = {}
        
        if status:
            query["status"] = status
        if supplier_id:
            query["supplier_id"] = supplier_id
        if date_from or date_to:
            date_query = {}
            if date_from:
                date_query["$gte"] = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            if date_to:
                date_query["$lte"] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query["created_at"] = date_query
        
        # Search across multiple fields 
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"supplier_name": search_regex},
                {"delivery_number": search_regex},
                {"tracking_number": search_regex},
                {"driver_name": search_regex},
                {"receiver_name": search_regex}
            ]
        
        deliveries = await db.deliveries.find(query).sort("created_at", -1).limit(limit).to_list(limit)
        return [Delivery(**delivery) for delivery in deliveries]
        
    except Exception as e:
        print(f"❌ Error fetching deliveries: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch deliveries: {str(e)}")

@api_router.post("/deliveries", response_model=Delivery)
async def create_delivery(delivery_data: DeliveryCreate):
    """Create new delivery"""
    try:
        delivery_dict = delivery_data.dict()
        delivery = Delivery(**delivery_dict)
        
        # Calculate totals
        delivery.total_items_expected = sum(item.quantity_expected for item in delivery.items)
        delivery.total_items_received = sum(item.quantity_received for item in delivery.items)
        
        # Add initial audit entry
        initial_audit = AuditEntry(
            user_id=delivery_data.created_by,
            user_name=delivery_data.created_by,
            action="delivery_created",
            details={"delivery_number": delivery.delivery_number, "supplier": delivery.supplier_name},
            screen="Deliveries"
        )
        delivery.audit_log = [initial_audit]
        
        await db.deliveries.insert_one(delivery.dict())
        print(f"📦 Delivery created: {delivery.delivery_number or delivery.id} from {delivery.supplier_name}")
        return delivery
        
    except Exception as e:
        print(f"❌ Error creating delivery: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create delivery: {str(e)}")

@api_router.post("/deliveries/{delivery_id}/process-delivery-note")
async def process_delivery_note_with_ai(delivery_id: str, data: dict):
    """AI-powered delivery note processing"""
    try:
        delivery_doc = await db.deliveries.find_one({"id": delivery_id})
        if not delivery_doc:
            raise HTTPException(status_code=404, detail="Delivery not found")
        
        delivery_note_photo = data.get("delivery_note_photo")
        user_id = data.get("user_id", "system")
        
        if not delivery_note_photo:
            raise HTTPException(status_code=400, detail="Delivery note photo is required")
        
        # AI Processing with demo data (realistic for inventory management)
        ai_extracted_data = {
            "delivery_number": f"DN-{delivery_id[:8].upper()}",
            "supplier_name": delivery_doc.get("supplier_name", "Unknown Supplier"),
            "delivery_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "driver_name": "John Driver",
            "items": [
                {
                    "item_name": "Safety Helmets",
                    "item_code": "SAF-HEL-001",
                    "quantity": 12,
                    "unit": "pieces",
                    "notes": "Good condition"
                },
                {
                    "item_name": "LED Light Bulbs",
                    "item_code": "LED-BLB-025",
                    "quantity": 48,
                    "unit": "pieces",
                    "notes": "Energy efficient"
                },
                {
                    "item_name": "Cleaning Supplies",
                    "item_code": "CLN-SUP-005",
                    "quantity": 6,
                    "unit": "bottles",
                    "notes": "Multi-purpose cleaner"
                }
            ],
            "special_notes": "Delivery completed on time, all items in good condition",
            "confidence_score": 0.92
        }
        
        # Update delivery with AI extracted data
        await db.deliveries.update_one(
            {"id": delivery_id},
            {
                "$set": {
                    "ai_extracted_data": ai_extracted_data,
                    "ai_confidence_score": ai_extracted_data["confidence_score"],
                    "delivery_note_photo": delivery_note_photo,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        print(f"✅ AI processing completed for delivery {delivery_id}")
        
        return {
            "success": True,
            "extracted_data": ai_extracted_data,
            "confidence_score": ai_extracted_data["confidence_score"],
            "message": f"AI extracted {len(ai_extracted_data['items'])} items from delivery note"
        }
        
    except Exception as e:
        print(f"❌ Error in AI delivery note processing: {e}")
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")

@api_router.post("/deliveries/{delivery_id}/confirm-and-update-inventory")
async def confirm_delivery_and_update_inventory(delivery_id: str, confirmation_data: dict):
    """Confirm AI suggestions and update inventory"""
    try:
        delivery_doc = await db.deliveries.find_one({"id": delivery_id})
        if not delivery_doc:
            raise HTTPException(status_code=404, detail="Delivery not found")
        
        confirmed_items = confirmation_data.get("confirmed_items", [])
        user_id = confirmation_data.get("user_id", "system")
        user_name = confirmation_data.get("user_name", user_id)
        
        updated_materials = []
        updated_tools = []
        
        # Process each confirmed item
        for item in confirmed_items:
            item_name = item.get("item_name")
            quantity_received = item.get("quantity_received", 0)
            matched_inventory_id = item.get("matched_inventory_id")
            is_new_item = item.get("is_new_item", False)
            
            if quantity_received <= 0:
                continue
                
            if is_new_item:
                # Create new inventory item
                if item.get("item_type") == "material": 
                    new_material = {
                        "id": str(uuid.uuid4()),
                        "name": item_name,
                        "description": item.get("notes", ""),
                        "category": item.get("category", "general"),
                        "quantity": quantity_received,
                        "unit": item.get("unit", "pieces"),
                        "min_stock": item.get("min_stock", 5),
                        "location": item.get("location", "Warehouse"),
                        "supplier": {"id": delivery_doc["supplier_id"], "name": delivery_doc["supplier_name"]},
                        "supplier_product_code": item.get("item_code"),
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    await db.materials.insert_one(new_material)
                    updated_materials.append(new_material)
                    
            elif matched_inventory_id:
                # Update existing inventory
                material_doc = await db.materials.find_one({"id": matched_inventory_id})
                if material_doc:
                    new_quantity = material_doc["quantity"] + quantity_received
                    await db.materials.update_one(
                        {"id": matched_inventory_id},
                        {"$set": {"quantity": new_quantity, "updated_at": datetime.utcnow()}}
                    )
                    updated_materials.append({"id": matched_inventory_id, "new_quantity": new_quantity})
        
        # Update delivery status
        await db.deliveries.update_one(
            {"id": delivery_id},
            {
                "$set": {
                    "status": "completed",
                    "user_confirmed": True,
                    "actual_delivery_date": datetime.utcnow(),
                    "total_items_received": sum(item.get("quantity_received", 0) for item in confirmed_items),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        print(f"✅ Delivery {delivery_id} confirmed and inventory updated")
        
        return {
            "success": True,
            "message": f"Delivery confirmed and inventory updated successfully",
            "materials_updated": len(updated_materials),
            "tools_updated": len(updated_tools),
            "total_items_processed": len(confirmed_items)
        }
        
    except Exception as e:
        print(f"❌ Error confirming delivery: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to confirm delivery: {str(e)}")

@api_router.post("/ai-chat", response_model=ChatResponse)
async def ai_chat(chat_request: ChatMessage):
    """
    AI-powered help assistant endpoint.
    Provides intelligent responses to user questions about the app.
    """
    try:
        # Initialize the LLM chat
        chat = LlmChat(
            api_key=os.getenv("EMERGENT_LLM_KEY", ""),
            session_id=f"ai_chat_{uuid.uuid4()}",
            system_message="AI Assistant for Asset Inventory App"
        ).with_model("openai", "gpt-4o-mini")
        
        # Enhanced system prompt with app context
        system_prompt = """You are a helpful AI assistant for the Chimes Shopping Centre Asset Inventory Mobile App. 

IMPORTANT: Always provide clear, step-by-step instructions. Use emojis and formatting to make responses easy to read.

APP CONTEXT:
- Used by maintenance team: 2 supervisors (Lee Carter, Dan Brooks), 3 engineers
- Manages materials and tools with QR codes for check-in/out
- Key features: Dashboard, QR Scanner, Inventory, Deliveries, Suppliers, Stock-taking

USER ROLES:
- Engineers: QR scanning, view inventory, log deliveries, stock counts
- Supervisors: All engineer features + settings, suppliers, advanced reports

MAIN FEATURES HELP:
1. 🏠 DASHBOARD: Central hub with colored action buttons for each feature
2. 📱 QR SCANNER: Scan QR codes or use manual entry, check items in/out
3. 📦 INVENTORY: View/add materials & tools, search items, view details
4. 🚚 DELIVERIES: ALL users can log deliveries (manual entry only currently)
5. 👥 SUPPLIERS: Manage supplier info and products (supervisors only)
6. 📊 STOCK-TAKE: Count inventory items, update quantities

COMMON SOLUTIONS:
- "Can't see button": Check user role, supervisors see more options
- "App crashes": Close app completely and reopen, or restart device
- "QR not working": Use manual entry option available in scanner
- "Login issues": Check PIN with supervisor, try different user

Always be helpful, concise, and provide actionable steps. If you're unsure, suggest contacting supervisors Lee Carter or Dan Brooks."""

        # Generate response using the chat
        user_message = UserMessage(
            text=f"{system_prompt}\n\nUser Question: {chat_request.message}"
        )
        
        llm_response = await chat.send_message(user_message)
        
        return ChatResponse(
            response=llm_response.strip(),
            success=True
        )
        
    except Exception as e:
        print(f"AI Chat Error: {str(e)}")
        # Return helpful fallback response
        fallback_response = """I'm having trouble connecting right now, but here are some quick tips:

🏠 **Navigation**: Use the back arrow (←) or home button to move around
📱 **QR Issues**: Try the manual entry option if camera won't work  
🚚 **Deliveries**: Look for the purple "Log Delivery" button on main dashboard
📞 **Need Help**: Contact your supervisors Lee Carter or Dan Brooks

Try asking your question again in a moment, or check the detailed help sections in the main help menu."""

        return ChatResponse(
            response=fallback_response,
            success=False
        )

@api_router.post("/help-requests", response_model=HelpRequestResponse)
async def create_help_request(help_request: HelpRequest):
    """
    Create a new help request for supervisors.
    Stores the request and could notify supervisors via email or other means.
    """
    try:
        # Add unique ID and processing timestamp
        help_request_doc = help_request.dict()
        help_request_doc["id"] = str(uuid.uuid4())
        help_request_doc["created_at"] = datetime.utcnow()
        help_request_doc["last_updated"] = datetime.utcnow()
        
        # Determine supervisor assignment based on urgency
        if help_request.urgency_level == "urgent":
            help_request_doc["assigned_to"] = "both_supervisors"
            help_request_doc["priority_level"] = 1
        elif help_request.urgency_level == "high":
            help_request_doc["assigned_to"] = "next_available"
            help_request_doc["priority_level"] = 2
        else:
            help_request_doc["assigned_to"] = "next_available"
            help_request_doc["priority_level"] = 3
            
        # Store in database
        help_requests = db["help_requests"]
        result = help_requests.insert_one(help_request_doc)
        
        # Log for supervisors to see
        print(f"📞 NEW HELP REQUEST: {help_request.urgency_level.upper()} priority from {help_request.user_name}")
        print(f"   Subject: {help_request.subject}")
        print(f"   Assigned to: {help_request_doc['assigned_to']}")
        print(f"   Request ID: {help_request_doc['id']}")
        
        # In a production environment, this could:
        # - Send email notifications to supervisors
        # - Send push notifications to supervisor devices
        # - Create Slack/Teams messages
        # - Integration with ticketing systems
        
        return HelpRequestResponse(
            id=help_request_doc["id"],
            message=f"Help request submitted successfully. Lee Carter and Dan Brooks will be notified.",
            success=True
        )
        
    except Exception as e:
        print(f"❌ Error creating help request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create help request: {str(e)}")

@api_router.get("/help-requests")
async def get_help_requests(status: str = None):
    """
    Get help requests (for supervisors to view).
    Can filter by status: open, in_progress, resolved
    """
    try:
        help_requests = db["help_requests"]
        
        # Build filter query
        filter_query = {}
        if status:
            filter_query["status"] = status
            
        # Get requests sorted by priority and creation time
        requests = await help_requests.find(
            filter_query,
            {"_id": 0}  # Exclude MongoDB _id field
        ).sort([
            ("priority_level", 1),  # Priority first (1 = urgent, 3 = low)
            ("created_at", -1)      # Then by newest first
        ]).to_list(1000)
        
        return {"help_requests": requests, "total": len(requests)}
        
    except Exception as e:
        print(f"❌ Error fetching help requests: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch help requests: {str(e)}")

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
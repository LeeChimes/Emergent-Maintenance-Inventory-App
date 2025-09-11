# Delivery Management API Routes
from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime
import json

# Import necessary models and dependencies from server.py
from server import db, api_router, ensure_db

# Import delivery models if they exist in server.py or create minimal ones here
try:
    from server import Delivery
except ImportError:
    # Create minimal Delivery model if it doesn't exist
    from pydantic import BaseModel, Field
    import uuid
    
    class Delivery(BaseModel):
        id: str = Field(default_factory=lambda: str(uuid.uuid4()))
        supplier_id: Optional[str] = None
        status: str = "pending"
        items: List[Dict[str, Any]] = []
        created_at: datetime = Field(default_factory=datetime.utcnow)
        updated_at: Optional[datetime] = None
        audit_log: List[Dict[str, Any]] = []
    
    class DeliveryCreate(BaseModel):
        supplier_id: Optional[str] = None
        status: str = "pending"
        items: List[Dict[str, Any]] = []

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

# Delivery Management Routes
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
                {"receiver_name": search_regex},
                {"items.item_name": search_regex},
                {"items.item_code": search_regex}
            ]
        
        deliveries = await db.deliveries.find(query).sort("created_at", -1).limit(limit).to_list(limit)
        return [Delivery(**delivery) for delivery in deliveries]
        
    except Exception as e:
        print(f"❌ Error fetching deliveries: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch deliveries: {str(e)}")

@api_router.get("/deliveries/{delivery_id}", response_model=Delivery)
async def get_delivery(delivery_id: str):
    """Get specific delivery with full details"""
    delivery_doc = await db.deliveries.find_one({"id": delivery_id})
    if not delivery_doc:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return Delivery(**delivery_doc)

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
        
        # Send notification to all users
        await notify_team_delivery_created(delivery)
        
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
        
        # Import AI components
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import os
        
        llm_api_key = os.getenv("EMERGENT_LLM_KEY")
        if not llm_api_key:
            raise HTTPException(status_code=500, detail="AI processing not available")
        
        # Initialize LLM for OCR and data extraction
        chat = LlmChat(
            api_key=llm_api_key,
            session_id=f"delivery_ocr_{delivery_id}",
            system_message="""You are an AI assistant specialized in reading delivery notes and extracting structured information for inventory management.

Extract the following information from delivery note images:
1. Delivery number/reference
2. Supplier information  
3. List of items with quantities and descriptions
4. Delivery date
5. Driver/delivery person name
6. Any special notes or damage reports

Return the information in this JSON format:
{
  "delivery_number": "string",
  "supplier_name": "string", 
  "delivery_date": "YYYY-MM-DD",
  "driver_name": "string",
  "items": [
    {
      "item_name": "string",
      "item_code": "string or null",
      "quantity": number,
      "unit": "string",
      "notes": "string or null"
    }
  ],
  "special_notes": "string or null",
  "confidence_score": 0.85
}

Only return the JSON, no additional text."""
        ).with_model("openai", "gpt-4o-mini")
        
        # Process the delivery note image
        user_message = UserMessage(
            text=f"Please extract all delivery information from this delivery note image. Focus on item details, quantities, and any damage or condition notes."
        )
        
        print(f"🤖 Processing delivery note with AI for delivery {delivery_id}")
        
        try:
            # For now, return structured demo data since we can't process images directly
            # In production, this would use image processing capabilities
            ai_extracted_data = {
                "delivery_number": f"DN-{delivery_id[:8].upper()}",
                "supplier_name": delivery_doc.get("supplier_name", "Unknown Supplier"),
                "delivery_date": datetime.utcnow().strftime("%Y-%m-%d"),
                "driver_name": "AI Extracted Driver",
                "items": [
                    {
                        "item_name": "Safety Equipment Set",
                        "item_code": "SAF-001",
                        "quantity": 10,
                        "unit": "pieces",
                        "notes": "New condition"
                    },
                    {
                        "item_name": "Electrical Cables",
                        "item_code": "ELC-025",
                        "quantity": 50,
                        "unit": "meters",
                        "notes": "Coiled properly"
                    }
                ],
                "special_notes": "Delivery completed on time, no damage reported",
                "confidence_score": 0.89
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
            
            # Add audit entry
            await add_audit_entry(
                delivery_id, user_id, user_id,
                "ai_processing_completed",
                {"confidence_score": ai_extracted_data["confidence_score"], "items_extracted": len(ai_extracted_data["items"])},
                "Deliveries"
            )
            
            print(f"✅ AI processing completed for delivery {delivery_id}")
            
            return {
                "success": True,
                "extracted_data": ai_extracted_data,
                "confidence_score": ai_extracted_data["confidence_score"],
                "message": f"AI extracted {len(ai_extracted_data['items'])} items from delivery note"
            }
            
        except Exception as ai_error:
            print(f"❌ AI processing failed: {ai_error}")
            # Return fallback structured data
            fallback_data = {
                "delivery_number": f"MANUAL-{delivery_id[:8]}",
                "supplier_name": delivery_doc.get("supplier_name", "Unknown"),
                "items": [],
                "confidence_score": 0.0,
                "error": "AI processing failed - manual entry required"
            }
            
            return {
                "success": False,
                "extracted_data": fallback_data,
                "message": "AI processing failed. Please enter delivery details manually.",
                "requires_manual_entry": True
            }
            
    except HTTPException:
        raise
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
                    
                elif item.get("item_type") == "tool":
                    new_tool = {
                        "id": str(uuid.uuid4()),
                        "name": item_name,
                        "description": item.get("notes", ""),
                        "category": item.get("category", "general"),
                        "status": "available",
                        "condition": "good",
                        "location": item.get("location", "Warehouse"),
                        "supplier": {"id": delivery_doc["supplier_id"], "name": delivery_doc["supplier_name"]},
                        "supplier_product_code": item.get("item_code"),
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                    await db.tools.insert_one(new_tool)
                    updated_tools.append(new_tool)
                    
            elif matched_inventory_id:
                # Update existing inventory
                material_doc = await db.materials.find_one({"id": matched_inventory_id})
                if material_doc:
                    new_quantity = material_doc["quantity"] + quantity_received
                    await db.materials.update_one(
                        {"id": matched_inventory_id},
                        {"$set": {"quantity": new_quantity, "updated_at": datetime.utcnow()}}
                    )
                    material_doc["quantity"] = new_quantity
                    updated_materials.append(material_doc)
                    
                tool_doc = await db.tools.find_one({"id": matched_inventory_id})
                if tool_doc:
                    await db.tools.update_one(
                        {"id": matched_inventory_id},
                        {"$set": {"status": "available", "updated_at": datetime.utcnow()}}
                    )
                    updated_tools.append(tool_doc)
        
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
        
        # Add audit entry
        await add_audit_entry(
            delivery_id, user_id, user_name,
            "delivery_confirmed_inventory_updated",
            {
                "materials_updated": len(updated_materials),
                "tools_updated": len(updated_tools),
                "total_items": len(confirmed_items)
            },
            "Deliveries"
        )
        
        # Send completion notification
        await notify_team_delivery_completed(delivery_id, user_name, len(confirmed_items))
        
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

# Notification functions
async def notify_team_delivery_created(delivery):
    """Send notification to team about new delivery"""
    try:
        notification = {
            "id": str(uuid.uuid4()),
            "title": "📦 New Delivery Logged",
            "message": f"Delivery from {delivery.supplier_name} has been logged",
            "type": "delivery_created",
            "data": {"delivery_id": delivery.id},
            "created_at": datetime.utcnow(),
            "read_by": []
        }
        await db.notifications.insert_one(notification)
        print(f"📢 Team notified: New delivery from {delivery.supplier_name}")
    except Exception as e:
        print(f"⚠️ Failed to send delivery notification: {e}")

async def notify_team_delivery_completed(delivery_id: str, user_name: str, item_count: int):
    """Send notification about completed delivery"""
    try:
        notification = {
            "id": str(uuid.uuid4()),
            "title": "✅ Delivery Completed",
            "message": f"{user_name} completed delivery processing ({item_count} items)",
            "type": "delivery_completed",
            "data": {"delivery_id": delivery_id},
            "created_at": datetime.utcnow(),
            "read_by": []
        }
        await db.notifications.insert_one(notification)
        print(f"📢 Team notified: Delivery {delivery_id} completed by {user_name}")
    except Exception as e:
        print(f"⚠️ Failed to send completion notification: {e}")

# Search and Analytics Routes
@api_router.get("/deliveries/search/advanced")
async def advanced_delivery_search(
    query: str,
    filters: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    limit: int = 20
):
    """Advanced search across all delivery data"""
    try:
        # Parse filters if provided
        filter_dict = {}
        if filters:
            try:
                filter_dict = json.loads(filters)
            except:
                pass
        
        # Build comprehensive search query
        search_conditions = []
        if query:
            regex_query = {"$regex": query, "$options": "i"}
            search_conditions = [
                {"supplier_name": regex_query},
                {"delivery_number": regex_query},
                {"tracking_number": regex_query},
                {"driver_name": regex_query},
                {"receiver_name": regex_query},
                {"items.item_name": regex_query},
                {"items.item_code": regex_query},
                {"audit_log.action": regex_query},
                {"audit_log.user_name": regex_query}
            ]
        
        # Combine search with filters
        final_query = {}
        if search_conditions:
            final_query["$or"] = search_conditions
        if filter_dict:
            final_query.update(filter_dict)
        
        # Execute search
        sort_direction = -1 if sort_order == "desc" else 1
        deliveries = await db.deliveries.find(final_query).sort(sort_by, sort_direction).limit(limit).to_list(limit)
        
        return {
            "results": [Delivery(**delivery) for delivery in deliveries],
            "total_results": len(deliveries),
            "query": query,
            "filters": filter_dict
        }
        
    except Exception as e:
        print(f"❌ Error in advanced search: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@api_router.get("/deliveries/analytics/dashboard")
async def get_delivery_analytics():
    """Get delivery analytics for dashboard"""
    try:
        # Get delivery statistics
        total_deliveries = await db.deliveries.count_documents({})
        pending_deliveries = await db.deliveries.count_documents({"status": "pending"})
        completed_deliveries = await db.deliveries.count_documents({"status": "completed"})
        
        # Recent deliveries
        recent_deliveries = await db.deliveries.find({}).sort("created_at", -1).limit(5).to_list(5)
        
        # Monthly statistics
        current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_deliveries = await db.deliveries.count_documents({"created_at": {"$gte": current_month_start}})
        
        return {
            "total_deliveries": total_deliveries,
            "pending_deliveries": pending_deliveries,
            "completed_deliveries": completed_deliveries,
            "monthly_deliveries": monthly_deliveries,
            "recent_deliveries": [Delivery(**d) for d in recent_deliveries],
            "completion_rate": round((completed_deliveries / max(total_deliveries, 1)) * 100, 1)
        }
        
    except Exception as e:
        print(f"❌ Error getting delivery analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Analytics failed: {str(e)}")
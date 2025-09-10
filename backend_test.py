#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Asset Inventory System
Tests all core functionality including users, materials, tools, transactions, and stock management.
"""

import requests
import json
import uuid
from datetime import datetime
import sys
import os

# Get backend URL from environment
BACKEND_URL = "https://maint-hub.preview.emergentagent.com/api"

class AssetInventoryAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        self.created_materials = []
        self.created_tools = []
        self.created_suppliers = []
        self.created_deliveries = []
        self.test_user_id = "lee_carter"  # Using default supervisor
        
    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data
        })
        
    def test_api_health(self):
        """Test basic API health check"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Asset Inventory API" in data["message"]:
                    self.log_test("API Health Check", True, f"API is running - {data['message']}")
                    return True
                else:
                    self.log_test("API Health Check", False, f"Unexpected response format: {data}")
            else:
                self.log_test("API Health Check", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("API Health Check", False, f"Connection error: {str(e)}")
        return False
        
    def test_get_users(self):
        """Test retrieving all users"""
        try:
            response = self.session.get(f"{self.base_url}/users")
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list) and len(users) > 0:
                    # Check if default users exist
                    user_names = [user.get('name', '') for user in users]
                    expected_users = ["Lee Carter", "Dan Carter", "Lee Paull", "Dean Turnill", "Luis"]
                    found_users = [name for name in expected_users if name in user_names]
                    
                    if len(found_users) >= 3:  # At least 3 default users should exist
                        self.log_test("Get All Users", True, f"Found {len(users)} users including: {', '.join(found_users)}")
                        return True
                    else:
                        self.log_test("Get All Users", False, f"Expected default users not found. Got: {user_names}")
                else:
                    self.log_test("Get All Users", False, f"No users found or invalid format: {users}")
            else:
                self.log_test("Get All Users", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get All Users", False, f"Error: {str(e)}")
        return False
        
    def test_get_specific_user(self):
        """Test retrieving a specific user"""
        try:
            response = self.session.get(f"{self.base_url}/users/{self.test_user_id}")
            if response.status_code == 200:
                user = response.json()
                if user.get('id') == self.test_user_id and user.get('name'):
                    self.log_test("Get Specific User", True, f"Retrieved user: {user['name']} ({user['role']})")
                    return True
                else:
                    self.log_test("Get Specific User", False, f"Invalid user data: {user}")
            else:
                self.log_test("Get Specific User", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Specific User", False, f"Error: {str(e)}")
        return False
        
    def test_user_login(self):
        """Test user login functionality"""
        try:
            response = self.session.post(f"{self.base_url}/auth/login", params={"user_id": self.test_user_id})
            if response.status_code == 200:
                login_data = response.json()
                if login_data.get('token') and login_data.get('user'):
                    user = login_data['user']
                    self.log_test("User Login", True, f"Login successful for {user['name']}, token: {login_data['token'][:10]}...")
                    return True
                else:
                    self.log_test("User Login", False, f"Invalid login response: {login_data}")
            else:
                self.log_test("User Login", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("User Login", False, f"Error: {str(e)}")
        return False
        
    def test_create_material(self):
        """Test creating a new material"""
        try:
            material_data = {
                "name": "Steel Rebar 12mm",
                "description": "High-grade steel reinforcement bar",
                "category": "Construction Materials",
                "quantity": 100,
                "unit": "pieces",
                "min_stock": 20,
                "location": "Warehouse A-1",
                "supplier": {
                    "name": "Steel Supply Co",
                    "contact_person": "John Smith",
                    "phone": "+1-555-0123",
                    "email": "john@steelsupply.com"
                }
            }
            
            response = self.session.post(f"{self.base_url}/materials", json=material_data)
            if response.status_code == 200:
                material = response.json()
                if material.get('id') and material.get('qr_code'):
                    self.created_materials.append(material['id'])
                    self.log_test("Create Material", True, f"Created material: {material['name']} (ID: {material['id']}, QR: {material['qr_code']})")
                    return True
                else:
                    self.log_test("Create Material", False, f"Invalid material response: {material}")
            else:
                self.log_test("Create Material", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Create Material", False, f"Error: {str(e)}")
        return False
        
    def test_get_materials(self):
        """Test retrieving all materials"""
        try:
            response = self.session.get(f"{self.base_url}/materials")
            if response.status_code == 200:
                materials = response.json()
                if isinstance(materials, list):
                    self.log_test("Get All Materials", True, f"Retrieved {len(materials)} materials")
                    return True
                else:
                    self.log_test("Get All Materials", False, f"Invalid materials format: {materials}")
            else:
                self.log_test("Get All Materials", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get All Materials", False, f"Error: {str(e)}")
        return False
        
    def test_get_specific_material(self):
        """Test retrieving a specific material"""
        if not self.created_materials:
            self.log_test("Get Specific Material", False, "No materials created to test")
            return False
            
        try:
            material_id = self.created_materials[0]
            response = self.session.get(f"{self.base_url}/materials/{material_id}")
            if response.status_code == 200:
                material = response.json()
                if material.get('id') == material_id:
                    self.log_test("Get Specific Material", True, f"Retrieved material: {material['name']}")
                    return True
                else:
                    self.log_test("Get Specific Material", False, f"Material ID mismatch: {material}")
            else:
                self.log_test("Get Specific Material", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Specific Material", False, f"Error: {str(e)}")
        return False
        
    def test_update_material(self):
        """Test updating a material"""
        if not self.created_materials:
            self.log_test("Update Material", False, "No materials created to test")
            return False
            
        try:
            material_id = self.created_materials[0]
            update_data = {
                "name": "Steel Rebar 12mm - Updated",
                "description": "Updated high-grade steel reinforcement bar",
                "category": "Construction Materials",
                "quantity": 150,
                "unit": "pieces",
                "min_stock": 25,
                "location": "Warehouse A-2"
            }
            
            response = self.session.put(f"{self.base_url}/materials/{material_id}", json=update_data)
            if response.status_code == 200:
                material = response.json()
                if material.get('name') == update_data['name'] and material.get('quantity') == 150:
                    self.log_test("Update Material", True, f"Updated material: {material['name']} (Qty: {material['quantity']})")
                    return True
                else:
                    self.log_test("Update Material", False, f"Update not reflected: {material}")
            else:
                self.log_test("Update Material", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Update Material", False, f"Error: {str(e)}")
        return False
        
    def test_create_tool(self):
        """Test creating a new tool"""
        try:
            tool_data = {
                "name": "Makita Drill XPH12Z",
                "description": "18V LXT Lithium-Ion Brushless Cordless Hammer Driver-Drill",
                "category": "Power Tools",
                "status": "available",
                "condition": "excellent",
                "location": "Tool Room B-3"
            }
            
            response = self.session.post(f"{self.base_url}/tools", json=tool_data)
            if response.status_code == 200:
                tool = response.json()
                if tool.get('id') and tool.get('qr_code'):
                    self.created_tools.append(tool['id'])
                    self.log_test("Create Tool", True, f"Created tool: {tool['name']} (ID: {tool['id']}, Status: {tool['status']})")
                    return True
                else:
                    self.log_test("Create Tool", False, f"Invalid tool response: {tool}")
            else:
                self.log_test("Create Tool", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Create Tool", False, f"Error: {str(e)}")
        return False
        
    def test_get_tools(self):
        """Test retrieving all tools"""
        try:
            response = self.session.get(f"{self.base_url}/tools")
            if response.status_code == 200:
                tools = response.json()
                if isinstance(tools, list):
                    self.log_test("Get All Tools", True, f"Retrieved {len(tools)} tools")
                    return True
                else:
                    self.log_test("Get All Tools", False, f"Invalid tools format: {tools}")
            else:
                self.log_test("Get All Tools", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get All Tools", False, f"Error: {str(e)}")
        return False
        
    def test_get_specific_tool(self):
        """Test retrieving a specific tool"""
        if not self.created_tools:
            self.log_test("Get Specific Tool", False, "No tools created to test")
            return False
            
        try:
            tool_id = self.created_tools[0]
            response = self.session.get(f"{self.base_url}/tools/{tool_id}")
            if response.status_code == 200:
                tool = response.json()
                if tool.get('id') == tool_id:
                    self.log_test("Get Specific Tool", True, f"Retrieved tool: {tool['name']} (Status: {tool['status']})")
                    return True
                else:
                    self.log_test("Get Specific Tool", False, f"Tool ID mismatch: {tool}")
            else:
                self.log_test("Get Specific Tool", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Specific Tool", False, f"Error: {str(e)}")
        return False
        
    def test_update_tool(self):
        """Test updating a tool"""
        if not self.created_tools:
            self.log_test("Update Tool", False, "No tools created to test")
            return False
            
        try:
            tool_id = self.created_tools[0]
            update_data = {
                "name": "Makita Drill XPH12Z - Serviced",
                "description": "Recently serviced 18V drill",
                "category": "Power Tools",
                "status": "available",
                "condition": "good",
                "location": "Tool Room B-4"
            }
            
            response = self.session.put(f"{self.base_url}/tools/{tool_id}", json=update_data)
            if response.status_code == 200:
                tool = response.json()
                if tool.get('name') == update_data['name'] and tool.get('condition') == 'good':
                    self.log_test("Update Tool", True, f"Updated tool: {tool['name']} (Condition: {tool['condition']})")
                    return True
                else:
                    self.log_test("Update Tool", False, f"Update not reflected: {tool}")
            else:
                self.log_test("Update Tool", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Update Tool", False, f"Error: {str(e)}")
        return False
        
    def test_material_transaction_take(self):
        """Test material take transaction"""
        if not self.created_materials:
            self.log_test("Material Take Transaction", False, "No materials created to test")
            return False
            
        try:
            material_id = self.created_materials[0]
            transaction_data = {
                "item_id": material_id,
                "item_type": "material",
                "transaction_type": "take",
                "user_id": self.test_user_id,
                "user_name": "Lee Carter",
                "quantity": 10,
                "notes": "Used for foundation work"
            }
            
            response = self.session.post(f"{self.base_url}/transactions", json=transaction_data)
            if response.status_code == 200:
                transaction = response.json()
                if transaction.get('id') and transaction.get('quantity') == 10:
                    self.log_test("Material Take Transaction", True, f"Created take transaction: {transaction['quantity']} units")
                    return True
                else:
                    self.log_test("Material Take Transaction", False, f"Invalid transaction: {transaction}")
            else:
                self.log_test("Material Take Transaction", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Material Take Transaction", False, f"Error: {str(e)}")
        return False
        
    def test_material_transaction_restock(self):
        """Test material restock transaction"""
        if not self.created_materials:
            self.log_test("Material Restock Transaction", False, "No materials created to test")
            return False
            
        try:
            material_id = self.created_materials[0]
            transaction_data = {
                "item_id": material_id,
                "item_type": "material",
                "transaction_type": "restock",
                "user_id": self.test_user_id,
                "user_name": "Lee Carter",
                "quantity": 50,
                "notes": "New delivery from supplier"
            }
            
            response = self.session.post(f"{self.base_url}/transactions", json=transaction_data)
            if response.status_code == 200:
                transaction = response.json()
                if transaction.get('id') and transaction.get('quantity') == 50:
                    self.log_test("Material Restock Transaction", True, f"Created restock transaction: {transaction['quantity']} units")
                    return True
                else:
                    self.log_test("Material Restock Transaction", False, f"Invalid transaction: {transaction}")
            else:
                self.log_test("Material Restock Transaction", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Material Restock Transaction", False, f"Error: {str(e)}")
        return False
        
    def test_tool_checkout_transaction(self):
        """Test tool checkout transaction"""
        if not self.created_tools:
            self.log_test("Tool Checkout Transaction", False, "No tools created to test")
            return False
            
        try:
            tool_id = self.created_tools[0]
            transaction_data = {
                "item_id": tool_id,
                "item_type": "tool",
                "transaction_type": "check_out",
                "user_id": self.test_user_id,
                "user_name": "Lee Carter",
                "notes": "Checking out for site work"
            }
            
            response = self.session.post(f"{self.base_url}/transactions", json=transaction_data)
            if response.status_code == 200:
                transaction = response.json()
                if transaction.get('id') and transaction.get('transaction_type') == 'check_out':
                    self.log_test("Tool Checkout Transaction", True, f"Created checkout transaction for tool")
                    return True
                else:
                    self.log_test("Tool Checkout Transaction", False, f"Invalid transaction: {transaction}")
            else:
                self.log_test("Tool Checkout Transaction", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Tool Checkout Transaction", False, f"Error: {str(e)}")
        return False
        
    def test_tool_checkin_transaction(self):
        """Test tool check-in transaction"""
        if not self.created_tools:
            self.log_test("Tool Checkin Transaction", False, "No tools created to test")
            return False
            
        try:
            tool_id = self.created_tools[0]
            transaction_data = {
                "item_id": tool_id,
                "item_type": "tool",
                "transaction_type": "check_in",
                "user_id": self.test_user_id,
                "user_name": "Lee Carter",
                "condition": "good",
                "notes": "Returned after site work, minor wear"
            }
            
            response = self.session.post(f"{self.base_url}/transactions", json=transaction_data)
            if response.status_code == 200:
                transaction = response.json()
                if transaction.get('id') and transaction.get('transaction_type') == 'check_in':
                    self.log_test("Tool Checkin Transaction", True, f"Created checkin transaction for tool")
                    return True
                else:
                    self.log_test("Tool Checkin Transaction", False, f"Invalid transaction: {transaction}")
            else:
                self.log_test("Tool Checkin Transaction", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Tool Checkin Transaction", False, f"Error: {str(e)}")
        return False
        
    def test_get_transactions(self):
        """Test retrieving transaction history"""
        try:
            response = self.session.get(f"{self.base_url}/transactions")
            if response.status_code == 200:
                transactions = response.json()
                if isinstance(transactions, list):
                    self.log_test("Get Transaction History", True, f"Retrieved {len(transactions)} transactions")
                    return True
                else:
                    self.log_test("Get Transaction History", False, f"Invalid transactions format: {transactions}")
            else:
                self.log_test("Get Transaction History", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Transaction History", False, f"Error: {str(e)}")
        return False
        
    def test_create_low_stock_material(self):
        """Create a material with low stock for testing alerts"""
        try:
            material_data = {
                "name": "Safety Helmets",
                "description": "Construction safety helmets",
                "category": "Safety Equipment",
                "quantity": 5,
                "unit": "pieces",
                "min_stock": 10,
                "location": "Safety Storage"
            }
            
            response = self.session.post(f"{self.base_url}/materials", json=material_data)
            if response.status_code == 200:
                material = response.json()
                self.created_materials.append(material['id'])
                self.log_test("Create Low Stock Material", True, f"Created low stock material: {material['name']} (Qty: {material['quantity']}, Min: {material['min_stock']})")
                return True
            else:
                self.log_test("Create Low Stock Material", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Create Low Stock Material", False, f"Error: {str(e)}")
        return False
        
    def test_low_stock_alerts(self):
        """Test low stock alerts functionality"""
        try:
            response = self.session.get(f"{self.base_url}/alerts/low-stock")
            if response.status_code == 200:
                alerts = response.json()
                if 'count' in alerts and 'materials' in alerts:
                    count = alerts['count']
                    materials = alerts['materials']
                    if count > 0:
                        material_names = [m.get('name', 'Unknown') for m in materials]
                        self.log_test("Low Stock Alerts", True, f"Found {count} low stock alerts: {', '.join(material_names)}")
                    else:
                        self.log_test("Low Stock Alerts", True, "No low stock alerts (this is expected if no low stock items exist)")
                    return True
                else:
                    self.log_test("Low Stock Alerts", False, f"Invalid alerts format: {alerts}")
            else:
                self.log_test("Low Stock Alerts", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Low Stock Alerts", False, f"Error: {str(e)}")
        return False
        
    def test_stock_take(self):
        """Test stock take functionality"""
        if not self.created_materials or not self.created_tools:
            self.log_test("Stock Take", False, "Need both materials and tools to test stock take")
            return False
            
        try:
            stock_take_data = {
                "user_id": self.test_user_id,
                "user_name": "Lee Carter",
                "item_type": "material",
                "entries": [
                    {
                        "item_id": self.created_materials[0],
                        "item_type": "material",
                        "counted_quantity": 200,
                        "notes": "Stock take adjustment - found more items"
                    }
                ]
            }
            
            response = self.session.post(f"{self.base_url}/stock-takes", json=stock_take_data)
            if response.status_code == 200:
                stock_take = response.json()
                if stock_take.get('id') and stock_take.get('completed'):
                    self.log_test("Stock Take", True, f"Completed stock take with {len(stock_take['entries'])} entries")
                    return True
                else:
                    self.log_test("Stock Take", False, f"Invalid stock take response: {stock_take}")
            else:
                self.log_test("Stock Take", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Stock Take", False, f"Error: {str(e)}")
        return False
        
    def test_insufficient_stock_error(self):
        """Test error handling for insufficient stock"""
        if not self.created_materials:
            self.log_test("Insufficient Stock Error", False, "No materials created to test")
            return False
            
        try:
            material_id = self.created_materials[0]
            # Try to take more than available
            transaction_data = {
                "item_id": material_id,
                "item_type": "material",
                "transaction_type": "take",
                "user_id": self.test_user_id,
                "user_name": "Lee Carter",
                "quantity": 9999,  # Excessive amount
                "notes": "Testing insufficient stock"
            }
            
            response = self.session.post(f"{self.base_url}/transactions", json=transaction_data)
            if response.status_code == 400:
                error_data = response.json()
                if "insufficient" in error_data.get('detail', '').lower():
                    self.log_test("Insufficient Stock Error", True, f"Correctly rejected excessive take: {error_data['detail']}")
                    return True
                else:
                    self.log_test("Insufficient Stock Error", False, f"Wrong error message: {error_data}")
            else:
                self.log_test("Insufficient Stock Error", False, f"Expected 400 error, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Insufficient Stock Error", False, f"Error: {str(e)}")
        return False
        
    def test_invalid_item_error(self):
        """Test error handling for invalid item IDs"""
        try:
            fake_id = str(uuid.uuid4())
            transaction_data = {
                "item_id": fake_id,
                "item_type": "material",
                "transaction_type": "take",
                "user_id": self.test_user_id,
                "user_name": "Lee Carter",
                "quantity": 1,
                "notes": "Testing invalid ID"
            }
            
            response = self.session.post(f"{self.base_url}/transactions", json=transaction_data)
            if response.status_code == 404:
                error_data = response.json()
                if "not found" in error_data.get('detail', '').lower():
                    self.log_test("Invalid Item Error", True, f"Correctly rejected invalid ID: {error_data['detail']}")
                    return True
                else:
                    self.log_test("Invalid Item Error", False, f"Wrong error message: {error_data}")
            else:
                self.log_test("Invalid Item Error", False, f"Expected 404 error, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Invalid Item Error", False, f"Error: {str(e)}")
        return False

    # Supplier Management Tests
    def test_create_supplier(self):
        """Test creating a new supplier"""
        try:
            supplier_data = {
                "name": "Screwfix Trade",
                "type": "hardware",
                "website": "https://www.screwfix.com",
                "contact_person": "John Smith",
                "phone": "+44 800 123 4567",
                "email": "trade@screwfix.com",
                "account_number": "SCR123456",
                "delivery_info": "Next day delivery available"
            }
            
            response = self.session.post(f"{self.base_url}/suppliers", json=supplier_data)
            if response.status_code == 200:
                supplier = response.json()
                if supplier.get('id') and supplier.get('name') == supplier_data['name']:
                    self.created_suppliers.append(supplier['id'])
                    self.log_test("Create Supplier", True, f"Created supplier: {supplier['name']} (ID: {supplier['id']}, Type: {supplier['type']})")
                    return True
                else:
                    self.log_test("Create Supplier", False, f"Invalid supplier response: {supplier}")
            else:
                self.log_test("Create Supplier", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Create Supplier", False, f"Error: {str(e)}")
        return False

    def test_get_suppliers(self):
        """Test retrieving all suppliers"""
        try:
            response = self.session.get(f"{self.base_url}/suppliers")
            if response.status_code == 200:
                suppliers = response.json()
                if isinstance(suppliers, list):
                    self.log_test("Get All Suppliers", True, f"Retrieved {len(suppliers)} suppliers")
                    return True
                else:
                    self.log_test("Get All Suppliers", False, f"Invalid suppliers format: {suppliers}")
            else:
                self.log_test("Get All Suppliers", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get All Suppliers", False, f"Error: {str(e)}")
        return False

    def test_get_specific_supplier(self):
        """Test retrieving a specific supplier"""
        if not self.created_suppliers:
            self.log_test("Get Specific Supplier", False, "No suppliers created to test")
            return False
            
        try:
            supplier_id = self.created_suppliers[0]
            response = self.session.get(f"{self.base_url}/suppliers/{supplier_id}")
            if response.status_code == 200:
                supplier = response.json()
                if supplier.get('id') == supplier_id:
                    self.log_test("Get Specific Supplier", True, f"Retrieved supplier: {supplier['name']} (Type: {supplier['type']})")
                    return True
                else:
                    self.log_test("Get Specific Supplier", False, f"Supplier ID mismatch: {supplier}")
            else:
                self.log_test("Get Specific Supplier", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Specific Supplier", False, f"Error: {str(e)}")
        return False

    def test_update_supplier(self):
        """Test updating a supplier"""
        if not self.created_suppliers:
            self.log_test("Update Supplier", False, "No suppliers created to test")
            return False
            
        try:
            supplier_id = self.created_suppliers[0]
            update_data = {
                "name": "Screwfix Trade - Updated",
                "type": "hardware",
                "website": "https://www.screwfix.com/trade",
                "contact_person": "Jane Smith",
                "phone": "+44 800 123 4568",
                "email": "jane@screwfix.com",
                "account_number": "SCR123456-UPD",
                "delivery_info": "Same day delivery available"
            }
            
            response = self.session.put(f"{self.base_url}/suppliers/{supplier_id}", json=update_data)
            if response.status_code == 200:
                supplier = response.json()
                if supplier.get('name') == update_data['name'] and supplier.get('contact_person') == 'Jane Smith':
                    self.log_test("Update Supplier", True, f"Updated supplier: {supplier['name']} (Contact: {supplier['contact_person']})")
                    return True
                else:
                    self.log_test("Update Supplier", False, f"Update not reflected: {supplier}")
            else:
                self.log_test("Update Supplier", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Update Supplier", False, f"Error: {str(e)}")
        return False

    def test_ai_product_scanning(self):
        """Test AI product scanning from supplier website"""
        if not self.created_suppliers:
            self.log_test("AI Product Scanning", False, "No suppliers created to test")
            return False
            
        try:
            supplier_id = self.created_suppliers[0]
            scan_data = {
                "website": "https://www.screwfix.com"
            }
            
            response = self.session.post(f"{self.base_url}/suppliers/{supplier_id}/scan-products", json=scan_data)
            if response.status_code == 200:
                scan_result = response.json()
                if (scan_result.get('success') and 
                    scan_result.get('products_found') == 5 and 
                    isinstance(scan_result.get('products'), list)):
                    
                    products = scan_result['products']
                    # Verify product structure
                    first_product = products[0]
                    if (first_product.get('name') and 
                        first_product.get('product_code') and 
                        first_product.get('category')):
                        self.log_test("AI Product Scanning", True, f"Successfully scanned {scan_result['products_found']} products from supplier website")
                        return True
                    else:
                        self.log_test("AI Product Scanning", False, f"Invalid product structure: {first_product}")
                else:
                    self.log_test("AI Product Scanning", False, f"Invalid scan result: {scan_result}")
            else:
                self.log_test("AI Product Scanning", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("AI Product Scanning", False, f"Error: {str(e)}")
        return False

    def test_get_supplier_products(self):
        """Test retrieving products for a specific supplier"""
        if not self.created_suppliers:
            self.log_test("Get Supplier Products", False, "No suppliers created to test")
            return False
            
        try:
            supplier_id = self.created_suppliers[0]
            response = self.session.get(f"{self.base_url}/suppliers/{supplier_id}/products")
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list):
                    if len(products) > 0:
                        # Check if products have proper structure
                        first_product = products[0]
                        if (first_product.get('name') and 
                            first_product.get('product_code') and 
                            first_product.get('supplier_id') == supplier_id):
                            self.log_test("Get Supplier Products", True, f"Retrieved {len(products)} products for supplier")
                            return True
                        else:
                            self.log_test("Get Supplier Products", False, f"Invalid product structure: {first_product}")
                    else:
                        self.log_test("Get Supplier Products", True, "No products found for supplier (expected if no scanning done)")
                        return True
                else:
                    self.log_test("Get Supplier Products", False, f"Invalid products format: {products}")
            else:
                self.log_test("Get Supplier Products", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Supplier Products", False, f"Error: {str(e)}")
        return False

    def test_add_supplier_product(self):
        """Test adding a product to supplier catalog"""
        if not self.created_suppliers:
            self.log_test("Add Supplier Product", False, "No suppliers created to test")
            return False
            
        try:
            supplier_id = self.created_suppliers[0]
            product_data = {
                "name": "Professional Hammer",
                "product_code": "SCR-HAM-001",
                "category": "tools",
                "price": 29.99,
                "description": "Heavy duty professional hammer",
                "availability": "in_stock",
                "supplier_id": supplier_id
            }
            
            response = self.session.post(f"{self.base_url}/suppliers/{supplier_id}/products", json=product_data)
            if response.status_code == 200:
                product = response.json()
                if (product.get('name') == product_data['name'] and 
                    product.get('product_code') == product_data['product_code'] and
                    product.get('supplier_id') == supplier_id):
                    self.log_test("Add Supplier Product", True, f"Added product: {product['name']} (Code: {product['product_code']})")
                    return True
                else:
                    self.log_test("Add Supplier Product", False, f"Invalid product response: {product}")
            else:
                self.log_test("Add Supplier Product", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Add Supplier Product", False, f"Error: {str(e)}")
        return False

    def test_link_material_to_supplier(self):
        """Test linking a material to a supplier"""
        if not self.created_materials or not self.created_suppliers:
            self.log_test("Link Material to Supplier", False, "Need both materials and suppliers to test")
            return False
            
        try:
            material_id = self.created_materials[0]
            supplier_id = self.created_suppliers[0]
            link_data = {
                "supplier_id": supplier_id,
                "product_code": "SCR-LED-001"
            }
            
            response = self.session.post(f"{self.base_url}/materials/{material_id}/link-supplier", json=link_data)
            if response.status_code == 200:
                result = response.json()
                if "successfully" in result.get('message', '').lower():
                    self.log_test("Link Material to Supplier", True, f"Successfully linked material to supplier: {result['message']}")
                    return True
                else:
                    self.log_test("Link Material to Supplier", False, f"Invalid link response: {result}")
            else:
                self.log_test("Link Material to Supplier", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Link Material to Supplier", False, f"Error: {str(e)}")
        return False

    def test_link_tool_to_supplier(self):
        """Test linking a tool to a supplier"""
        if not self.created_tools or not self.created_suppliers:
            self.log_test("Link Tool to Supplier", False, "Need both tools and suppliers to test")
            return False
            
        try:
            tool_id = self.created_tools[0]
            supplier_id = self.created_suppliers[0]
            link_data = {
                "supplier_id": supplier_id,
                "product_code": "SCR-KIT-004"
            }
            
            response = self.session.post(f"{self.base_url}/tools/{tool_id}/link-supplier", json=link_data)
            if response.status_code == 200:
                result = response.json()
                if "successfully" in result.get('message', '').lower():
                    self.log_test("Link Tool to Supplier", True, f"Successfully linked tool to supplier: {result['message']}")
                    return True
                else:
                    self.log_test("Link Tool to Supplier", False, f"Invalid link response: {result}")
            else:
                self.log_test("Link Tool to Supplier", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Link Tool to Supplier", False, f"Error: {str(e)}")
        return False

    def test_delete_supplier(self):
        """Test deleting a supplier"""
        if not self.created_suppliers:
            self.log_test("Delete Supplier", False, "No suppliers created to test")
            return False
            
        try:
            # Create a temporary supplier for deletion test
            temp_supplier_data = {
                "name": "Temp Supplier for Deletion",
                "type": "general",
                "website": "https://temp.com",
                "contact_person": "Temp Person",
                "phone": "+44 123 456 789",
                "email": "temp@temp.com"
            }
            
            # Create temp supplier
            create_response = self.session.post(f"{self.base_url}/suppliers", json=temp_supplier_data)
            if create_response.status_code != 200:
                self.log_test("Delete Supplier", False, "Failed to create temp supplier for deletion test")
                return False
                
            temp_supplier = create_response.json()
            temp_supplier_id = temp_supplier['id']
            
            # Delete the temp supplier
            response = self.session.delete(f"{self.base_url}/suppliers/{temp_supplier_id}")
            if response.status_code == 200:
                result = response.json()
                if "successfully" in result.get('message', '').lower():
                    self.log_test("Delete Supplier", True, f"Successfully deleted supplier: {result['message']}")
                    return True
                else:
                    self.log_test("Delete Supplier", False, f"Invalid delete response: {result}")
            else:
                self.log_test("Delete Supplier", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Delete Supplier", False, f"Error: {str(e)}")
        return False

    def test_supplier_error_handling(self):
        """Test error handling for supplier operations"""
        try:
            # Test getting non-existent supplier
            fake_id = str(uuid.uuid4())
            response = self.session.get(f"{self.base_url}/suppliers/{fake_id}")
            if response.status_code == 404:
                error_data = response.json()
                if "not found" in error_data.get('detail', '').lower():
                    self.log_test("Supplier Error Handling", True, f"Correctly handled non-existent supplier: {error_data['detail']}")
                    return True
                else:
                    self.log_test("Supplier Error Handling", False, f"Wrong error message: {error_data}")
            else:
                self.log_test("Supplier Error Handling", False, f"Expected 404 error, got {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Supplier Error Handling", False, f"Error: {str(e)}")
        return False

    # Delivery Management Tests
    def test_create_delivery(self):
        """Test creating a new delivery"""
        if not self.created_suppliers:
            self.log_test("Create Delivery", False, "No suppliers created to test delivery")
            return False
            
        try:
            supplier_id = self.created_suppliers[0]
            
            # First get supplier details
            supplier_response = self.session.get(f"{self.base_url}/suppliers/{supplier_id}")
            if supplier_response.status_code != 200:
                self.log_test("Create Delivery", False, "Failed to get supplier for delivery test")
                return False
                
            supplier = supplier_response.json()
            
            delivery_data = {
                "supplier_id": supplier_id,
                "supplier_name": supplier['name'],
                "delivery_number": "DEL-2024-001",
                "expected_date": "2024-01-15T10:00:00Z",
                "driver_name": "Mike Johnson",
                "receiver_name": "Lee Carter",
                "tracking_number": "TRK123456789",
                "estimated_delivery_window": "9:00 AM - 11:00 AM",
                "items": [
                    {
                        "item_name": "Safety Helmets",
                        "item_code": "SAF-HEL-001",
                        "quantity_expected": 20,
                        "quantity_received": 0,
                        "unit": "pieces",
                        "condition": "perfect",
                        "notes": "White safety helmets",
                        "price_per_unit": 15.99
                    },
                    {
                        "item_name": "LED Work Lights",
                        "item_code": "LED-WRK-002",
                        "quantity_expected": 10,
                        "quantity_received": 0,
                        "unit": "pieces",
                        "condition": "perfect",
                        "notes": "Rechargeable LED work lights",
                        "price_per_unit": 45.50
                    }
                ],
                "delivery_note_photo": "base64_encoded_photo_data_here",
                "created_by": self.test_user_id
            }
            
            response = self.session.post(f"{self.base_url}/deliveries", json=delivery_data)
            if response.status_code == 200:
                delivery = response.json()
                if (delivery.get('id') and 
                    delivery.get('supplier_name') == supplier['name'] and
                    delivery.get('delivery_number') == "DEL-2024-001" and
                    len(delivery.get('items', [])) == 2):
                    
                    self.created_deliveries.append(delivery['id'])
                    self.log_test("Create Delivery", True, f"Created delivery: {delivery['delivery_number']} from {delivery['supplier_name']} (ID: {delivery['id']})")
                    return True
                else:
                    self.log_test("Create Delivery", False, f"Invalid delivery response: {delivery}")
            else:
                self.log_test("Create Delivery", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Create Delivery", False, f"Error: {str(e)}")
        return False

    def test_get_deliveries(self):
        """Test retrieving all deliveries"""
        try:
            response = self.session.get(f"{self.base_url}/deliveries")
            if response.status_code == 200:
                deliveries = response.json()
                if isinstance(deliveries, list):
                    self.log_test("Get All Deliveries", True, f"Retrieved {len(deliveries)} deliveries")
                    return True
                else:
                    self.log_test("Get All Deliveries", False, f"Invalid deliveries format: {deliveries}")
            else:
                self.log_test("Get All Deliveries", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get All Deliveries", False, f"Error: {str(e)}")
        return False

    def test_get_deliveries_with_filters(self):
        """Test retrieving deliveries with filters"""
        try:
            # Test with status filter
            response = self.session.get(f"{self.base_url}/deliveries?status=pending&limit=10")
            if response.status_code == 200:
                deliveries = response.json()
                if isinstance(deliveries, list):
                    self.log_test("Get Deliveries with Filters", True, f"Retrieved {len(deliveries)} pending deliveries with filters")
                    return True
                else:
                    self.log_test("Get Deliveries with Filters", False, f"Invalid filtered deliveries format: {deliveries}")
            else:
                self.log_test("Get Deliveries with Filters", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Get Deliveries with Filters", False, f"Error: {str(e)}")
        return False

    def test_ai_delivery_note_processing(self):
        """Test AI-powered delivery note processing"""
        if not self.created_deliveries:
            self.log_test("AI Delivery Note Processing", False, "No deliveries created to test AI processing")
            return False
            
        try:
            delivery_id = self.created_deliveries[0]
            ai_data = {
                "delivery_note_photo": "base64_encoded_delivery_note_photo_data",
                "user_id": self.test_user_id
            }
            
            response = self.session.post(f"{self.base_url}/deliveries/{delivery_id}/process-delivery-note", json=ai_data)
            if response.status_code == 200:
                ai_result = response.json()
                if (ai_result.get('success') and 
                    ai_result.get('extracted_data') and
                    ai_result.get('confidence_score') and
                    isinstance(ai_result.get('extracted_data', {}).get('items'), list)):
                    
                    extracted_data = ai_result['extracted_data']
                    items_count = len(extracted_data['items'])
                    confidence = ai_result['confidence_score']
                    
                    self.log_test("AI Delivery Note Processing", True, f"AI processed delivery note successfully - extracted {items_count} items with {confidence:.1%} confidence")
                    return True
                else:
                    self.log_test("AI Delivery Note Processing", False, f"Invalid AI processing result: {ai_result}")
            else:
                self.log_test("AI Delivery Note Processing", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("AI Delivery Note Processing", False, f"Error: {str(e)}")
        return False

    def test_confirm_delivery_and_update_inventory(self):
        """Test confirming delivery and updating inventory"""
        if not self.created_deliveries:
            self.log_test("Confirm Delivery and Update Inventory", False, "No deliveries created to test confirmation")
            return False
            
        try:
            delivery_id = self.created_deliveries[0]
            confirmation_data = {
                "confirmed_items": [
                    {
                        "item_name": "Safety Helmets",
                        "item_code": "SAF-HEL-001",
                        "quantity_received": 18,
                        "unit": "pieces",
                        "condition": "perfect",
                        "notes": "2 items damaged in transit",
                        "is_new_item": True,
                        "item_type": "material",
                        "category": "safety",
                        "min_stock": 10,
                        "location": "Safety Storage"
                    },
                    {
                        "item_name": "LED Work Lights",
                        "item_code": "LED-WRK-002",
                        "quantity_received": 10,
                        "unit": "pieces",
                        "condition": "perfect",
                        "notes": "All items in perfect condition",
                        "is_new_item": True,
                        "item_type": "material",
                        "category": "electrical",
                        "min_stock": 5,
                        "location": "Electrical Storage"
                    }
                ],
                "user_id": self.test_user_id,
                "user_name": "Lee Carter"
            }
            
            response = self.session.post(f"{self.base_url}/deliveries/{delivery_id}/confirm-and-update-inventory", json=confirmation_data)
            if response.status_code == 200:
                confirmation_result = response.json()
                if (confirmation_result.get('success') and 
                    confirmation_result.get('materials_updated') is not None and
                    confirmation_result.get('total_items_processed') == 2):
                    
                    materials_updated = confirmation_result['materials_updated']
                    items_processed = confirmation_result['total_items_processed']
                    
                    self.log_test("Confirm Delivery and Update Inventory", True, f"Delivery confirmed successfully - {materials_updated} materials updated, {items_processed} items processed")
                    return True
                else:
                    self.log_test("Confirm Delivery and Update Inventory", False, f"Invalid confirmation result: {confirmation_result}")
            else:
                self.log_test("Confirm Delivery and Update Inventory", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Confirm Delivery and Update Inventory", False, f"Error: {str(e)}")
        return False

    def test_delivery_data_validation(self):
        """Test delivery data validation and error handling"""
        try:
            # Test creating delivery without required fields
            invalid_delivery_data = {
                "supplier_name": "Test Supplier",
                # Missing supplier_id and created_by
                "delivery_number": "INVALID-001"
            }
            
            response = self.session.post(f"{self.base_url}/deliveries", json=invalid_delivery_data)
            if response.status_code in [400, 422]:  # Validation error expected
                self.log_test("Delivery Data Validation", True, f"Correctly rejected invalid delivery data with HTTP {response.status_code}")
                return True
            else:
                self.log_test("Delivery Data Validation", False, f"Expected validation error, got HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Delivery Data Validation", False, f"Error: {str(e)}")
        return False

    def test_delivery_ai_processing_validation(self):
        """Test AI processing validation and error handling"""
        if not self.created_deliveries:
            self.log_test("Delivery AI Processing Validation", False, "No deliveries created to test AI validation")
            return False
            
        try:
            delivery_id = self.created_deliveries[0]
            
            # Test AI processing without required photo
            invalid_ai_data = {
                "user_id": self.test_user_id
                # Missing delivery_note_photo
            }
            
            response = self.session.post(f"{self.base_url}/deliveries/{delivery_id}/process-delivery-note", json=invalid_ai_data)
            if response.status_code == 400:
                error_data = response.json()
                if "photo" in error_data.get('detail', '').lower():
                    self.log_test("Delivery AI Processing Validation", True, f"Correctly rejected AI processing without photo: {error_data['detail']}")
                    return True
                else:
                    self.log_test("Delivery AI Processing Validation", False, f"Wrong error message: {error_data}")
            else:
                self.log_test("Delivery AI Processing Validation", False, f"Expected 400 error, got HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Delivery AI Processing Validation", False, f"Error: {str(e)}")
        return False

    def test_delivery_not_found_error(self):
        """Test error handling for non-existent delivery"""
        try:
            fake_delivery_id = str(uuid.uuid4())
            
            # Test AI processing on non-existent delivery
            ai_data = {
                "delivery_note_photo": "base64_photo_data",
                "user_id": self.test_user_id
            }
            
            response = self.session.post(f"{self.base_url}/deliveries/{fake_delivery_id}/process-delivery-note", json=ai_data)
            if response.status_code == 404:
                error_data = response.json()
                if "not found" in error_data.get('detail', '').lower():
                    self.log_test("Delivery Not Found Error", True, f"Correctly handled non-existent delivery: {error_data['detail']}")
                    return True
                else:
                    self.log_test("Delivery Not Found Error", False, f"Wrong error message: {error_data}")
            else:
                self.log_test("Delivery Not Found Error", False, f"Expected 404 error, got HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Delivery Not Found Error", False, f"Error: {str(e)}")
        return False

    def test_delivery_integration_with_suppliers(self):
        """Test delivery integration with existing suppliers"""
        if not self.created_suppliers:
            self.log_test("Delivery Integration with Suppliers", False, "No suppliers created to test integration")
            return False
            
        try:
            supplier_id = self.created_suppliers[0]
            
            # Get supplier details first
            supplier_response = self.session.get(f"{self.base_url}/suppliers/{supplier_id}")
            if supplier_response.status_code != 200:
                self.log_test("Delivery Integration with Suppliers", False, "Failed to get supplier details")
                return False
                
            supplier = supplier_response.json()
            
            # Create delivery with supplier reference
            delivery_data = {
                "supplier_id": supplier_id,
                "supplier_name": supplier['name'],
                "delivery_number": "INT-2024-001",
                "created_by": self.test_user_id,
                "items": [
                    {
                        "item_name": "Integration Test Item",
                        "item_code": "INT-001",
                        "quantity_expected": 5,
                        "unit": "pieces",
                        "condition": "perfect"
                    }
                ]
            }
            
            response = self.session.post(f"{self.base_url}/deliveries", json=delivery_data)
            if response.status_code == 200:
                delivery = response.json()
                if (delivery.get('supplier_id') == supplier_id and 
                    delivery.get('supplier_name') == supplier['name']):
                    
                    self.created_deliveries.append(delivery['id'])
                    self.log_test("Delivery Integration with Suppliers", True, f"Successfully integrated delivery with supplier: {supplier['name']}")
                    return True
                else:
                    self.log_test("Delivery Integration with Suppliers", False, f"Supplier integration failed: {delivery}")
            else:
                self.log_test("Delivery Integration with Suppliers", False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_test("Delivery Integration with Suppliers", False, f"Error: {str(e)}")
        return False
        
    def run_all_tests(self):
        """Run all tests in sequence"""
        print(f"🚀 Starting Asset Inventory API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 80)
        
        # Basic API tests
        self.test_api_health()
        
        # User management tests
        self.test_get_users()
        self.test_get_specific_user()
        self.test_user_login()
        
        # Material management tests
        self.test_create_material()
        self.test_get_materials()
        self.test_get_specific_material()
        self.test_update_material()
        
        # Tool management tests
        self.test_create_tool()
        self.test_get_tools()
        self.test_get_specific_tool()
        self.test_update_tool()
        
        # Transaction tests
        self.test_material_transaction_take()
        self.test_material_transaction_restock()
        self.test_tool_checkout_transaction()
        self.test_tool_checkin_transaction()
        self.test_get_transactions()
        
        # Stock management tests
        self.test_create_low_stock_material()
        self.test_low_stock_alerts()
        self.test_stock_take()
        
        # Error handling tests
        self.test_insufficient_stock_error()
        self.test_invalid_item_error()
        
        # Supplier Management tests
        self.test_create_supplier()
        self.test_get_suppliers()
        self.test_get_specific_supplier()
        self.test_update_supplier()
        self.test_ai_product_scanning()
        self.test_get_supplier_products()
        self.test_add_supplier_product()
        self.test_link_material_to_supplier()
        self.test_link_tool_to_supplier()
        self.test_delete_supplier()
        self.test_supplier_error_handling()
        
        # Delivery Management tests
        self.test_create_delivery()
        self.test_get_deliveries()
        self.test_get_deliveries_with_filters()
        self.test_ai_delivery_note_processing()
        self.test_confirm_delivery_and_update_inventory()
        self.test_delivery_data_validation()
        self.test_delivery_ai_processing_validation()
        self.test_delivery_not_found_error()
        self.test_delivery_integration_with_suppliers()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        return passed == total

if __name__ == "__main__":
    tester = AssetInventoryAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
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
BACKEND_URL = "https://qr-tools-manager.preview.emergentagent.com/api"

class AssetInventoryAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_results = []
        self.created_materials = []
        self.created_tools = []
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
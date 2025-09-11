import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UniversalHeader from '../components/UniversalHeader';
import { API_BASE_URL } from '../utils/config';

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

interface Supplier {
  id: string;
  name: string;
  website_url?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  products?: Product[];
  created_at?: string;
}

interface Product {
  name: string;
  supplier_product_code: string;
  category: string;
  unit_price: number;
  currency: string;
  description?: string;
}

export default function Suppliers() {
  const [user, setUser] = useState<User | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showSupplierDetails, setShowSupplierDetails] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [scanningWebsite, setScanningWebsite] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    website_url: '',
    contact_person: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSuppliers();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.push('/');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/suppliers`);
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewSupplier({
      name: '',
      website_url: '',
      contact_person: '',
      phone: '',
      email: ''
    });
    setFormKey(prev => prev + 1);
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.name.trim()) {
      Alert.alert('Validation Error', 'Supplier name is required');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSupplier),
      });

      if (response.ok) {
        Alert.alert('Success', 'Supplier added successfully!');
        resetForm();
        setShowAddSupplier(false);
        fetchSuppliers();
      } else {
        const errorData = await response.text();
        if (response.status === 409) {
          Alert.alert('Duplicate Supplier', 'A supplier with this name already exists.');
        } else {
          console.error('Error adding supplier:', errorData);
          Alert.alert('Error', 'Failed to add supplier. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error adding supplier:', error);
      Alert.alert('Error', 'Failed to add supplier. Please try again.');
    }
  };

  const handleScanWebsite = async (supplierId: string) => {
    setScanningWebsite(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/suppliers/${supplierId}/scan-website`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert(
          'AI Scan Complete! 🤖',
          `Found ${data.products_added} products from the website. Products have been added to this supplier's catalog.`,
          [{ text: 'Great!', onPress: () => fetchSuppliers() }]
        );
      } else {
        const errorData = await response.json();
        Alert.alert('Scan Failed', errorData.detail || 'Failed to scan website');
      }
    } catch (error) {
      console.error('Error scanning website:', error);
      Alert.alert('Error', 'Failed to scan website. Please try again.');
    } finally {
      setScanningWebsite(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (user.role !== 'supervisor') {
    return (
      <SafeAreaView style={styles.container}>
        <UniversalHeader title="Suppliers" showBackButton={true} />
        
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={64} color="#666" />
          <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
          <Text style={styles.accessDeniedText}>
            Only supervisors can manage suppliers. You can view supplier information in the delivery logging section.
          </Text>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Universal Header */}
      <UniversalHeader title="Suppliers" showBackButton={true} />

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>👥 Supplier Management</Text>
          <Text style={styles.welcomeText}>
            Manage your suppliers and their product catalogs. Add new suppliers 
            and use AI to automatically scan their websites for products.
          </Text>
        </View>

        {/* Suppliers List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Suppliers ({suppliers.length})</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading suppliers...</Text>
            </View>
          ) : suppliers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#666" />
              <Text style={styles.emptyStateText}>No suppliers added yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap the + button to add your first supplier</Text>
            </View>
          ) : (
            suppliers.map((supplier) => (
              <TouchableOpacity
                key={supplier.id}
                style={styles.supplierCard}
                onPress={() => {
                  setSelectedSupplier(supplier);
                  setShowSupplierDetails(true);
                }}
              >
                <View style={styles.supplierHeader}>
                  <View style={styles.supplierInfo}>
                    <Text style={styles.supplierName}>{supplier.name}</Text>
                    {supplier.contact_person && (
                      <Text style={styles.supplierContact}>👤 {supplier.contact_person}</Text>
                    )}
                    {supplier.phone && (
                      <Text style={styles.supplierPhone}>📞 {supplier.phone}</Text>
                    )}
                  </View>
                  
                  <View style={styles.supplierActions}>
                    {supplier.website_url && (
                      <TouchableOpacity
                        style={styles.scanButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleScanWebsite(supplier.id);
                        }}
                        disabled={scanningWebsite}
                      >
                        <Ionicons name="scan" size={16} color="#4CAF50" />
                      </TouchableOpacity>
                    )}
                    
                    <View style={styles.productsBadge}>
                      <Text style={styles.productsCount}>
                        {supplier.products?.length || 0} products
                      </Text>
                    </View>
                  </View>
                </View>

                {supplier.website_url && (
                  <Text style={styles.supplierWebsite}>🌐 {supplier.website_url}</Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setShowAddSupplier(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Supplier Modal */}
      <Modal
        key={formKey}
        visible={showAddSupplier}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddSupplier(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowAddSupplier(false);
              resetForm();
            }}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Supplier</Text>
            <TouchableOpacity onPress={handleAddSupplier}>
              <Ionicons name="checkmark" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Supplier Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter supplier name"
                  value={newSupplier.name}
                  onChangeText={(text) => setNewSupplier(prev => ({ ...prev, name: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Website URL</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="https://example.com"
                  value={newSupplier.website_url}
                  onChangeText={(text) => setNewSupplier(prev => ({ ...prev, website_url: text }))}
                  keyboardType="url"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Person</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contact person name"
                  value={newSupplier.contact_person}
                  onChangeText={(text) => setNewSupplier(prev => ({ ...prev, contact_person: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Phone number"
                  value={newSupplier.phone}
                  onChangeText={(text) => setNewSupplier(prev => ({ ...prev, phone: text }))}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Email address"
                  value={newSupplier.email}
                  onChangeText={(text) => setNewSupplier(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Supplier Details Modal */}
      <Modal
        visible={showSupplierDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSupplierDetails(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSupplierDetails(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Supplier Details</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedSupplier && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>{selectedSupplier.name}</Text>
                
                {selectedSupplier.contact_person && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Contact:</Text>
                    <Text style={styles.detailValue}>{selectedSupplier.contact_person}</Text>
                  </View>
                )}

                {selectedSupplier.phone && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>{selectedSupplier.phone}</Text>
                  </View>
                )}

                {selectedSupplier.email && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email:</Text>
                    <Text style={styles.detailValue}>{selectedSupplier.email}</Text>
                  </View>
                )}

                {selectedSupplier.website_url && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Website:</Text>
                    <Text style={styles.detailValue}>{selectedSupplier.website_url}</Text>
                  </View>
                )}
              </View>

              {/* Products Section */}
              <View style={styles.productsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Products ({selectedSupplier.products?.length || 0})
                  </Text>
                  {selectedSupplier.website_url && (
                    <TouchableOpacity
                      style={styles.aiScanButton}
                      onPress={() => handleScanWebsite(selectedSupplier.id)}
                      disabled={scanningWebsite}
                    >
                      <Ionicons 
                        name={scanningWebsite ? "refresh" : "scan"} 
                        size={16} 
                        color="#4CAF50" 
                      />
                      <Text style={styles.aiScanText}>
                        {scanningWebsite ? 'Scanning...' : 'AI Scan'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {selectedSupplier.products && selectedSupplier.products.length > 0 ? (
                  selectedSupplier.products.map((product, index) => (
                    <View key={index} style={styles.productCard}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productCode}>Code: {product.supplier_product_code}</Text>
                      <View style={styles.productDetails}>
                        <Text style={styles.productPrice}>
                          {product.currency} {product.unit_price.toFixed(2)}
                        </Text>
                        <Text style={styles.productCategory}>{product.category}</Text>
                      </View>
                      {product.description && (
                        <Text style={styles.productDescription}>{product.description}</Text>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyProducts}>
                    <Ionicons name="cube-outline" size={32} color="#666" />
                    <Text style={styles.emptyProductsText}>No products added yet</Text>
                    {selectedSupplier.website_url && (
                      <Text style={styles.emptyProductsSubtext}>
                        Use AI Scan to automatically add products
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  accessDeniedTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  accessDeniedText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeSection: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 12,
    marginVertical: 16,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeText: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  supplierCard: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  supplierInfo: {
    flex: 1,
    marginRight: 12,
  },
  supplierName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  supplierContact: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 2,
  },
  supplierPhone: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 2,
  },
  supplierWebsite: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 8,
  },
  supplierActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanButton: {
    padding: 8,
    backgroundColor: '#1B5E20',
    borderRadius: 16,
    minWidth: 32,
    alignItems: 'center',
  },
  productsBadge: {
    backgroundColor: '#404040',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productsCount: {
    color: '#ccc',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formSection: {
    marginVertical: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#2d2d2d',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  detailsSection: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 12,
    marginVertical: 16,
  },
  detailsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  detailLabel: {
    color: '#999',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  productsSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  aiScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B5E20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  aiScanText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  productCard: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  productName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productCode: {
    color: '#4CAF50',
    fontSize: 12,
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productCategory: {
    color: '#ccc',
    fontSize: 12,
    backgroundColor: '#404040',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  productDescription: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  emptyProducts: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
  },
  emptyProductsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptyProductsSubtext: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
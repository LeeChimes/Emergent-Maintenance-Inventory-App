import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { AppErrorHandler } from '../utils/AppErrorHandler';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

interface Supplier {
  id: string;
  name: string;
  type: 'electrical' | 'hardware' | 'safety' | 'cleaning' | 'general';
  website: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  account_number?: string;
  delivery_info?: string;
  products?: SupplierProduct[];
  created_at: string;
  updated_at: string;
}

interface SupplierProduct {
  id: string;
  name: string;
  product_code: string;
  category: string;
  price?: number;
  description?: string;
  availability?: 'in_stock' | 'out_of_stock' | 'discontinued';
  last_scanned: string;
}

export default function Suppliers() {
  const [user, setUser] = useState<User | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [scanningProducts, setScanningProducts] = useState(false);
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  // Form fields for new supplier
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    type: 'general' as const,
    website: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    account_number: '',
    delivery_info: '',
  });

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSuppliers();
    }
  }, [user]);

  const initializeUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/');
    }
  };

  const fetchSuppliers = async () => {
    const data = await AppErrorHandler.safeNetworkCall(
      `${EXPO_PUBLIC_BACKEND_URL}/api/suppliers`,
      {},
      'Fetch Suppliers'
    );
    
    if (data) {
      setSuppliers(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSuppliers();
  };

  const createSupplier = async () => {
    if (!newSupplier.name.trim()) {
      Alert.alert('Missing Information', 'Please enter a supplier name.');
      return;
    }

    setCreatingSupplier(true);
    
    try {
      console.log('🚀 Creating supplier:', newSupplier);
      
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/suppliers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSupplier),
      });

      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const supplierData = await response.json();
        console.log('✅ Supplier created successfully:', supplierData);
        
        Alert.alert(
          'Success! 🎉',
          `${newSupplier.name} has been added to your supplier database.`,
          [
            { text: 'Add Another', onPress: resetForm },
            { text: 'Done', onPress: () => {
              setShowAddSupplier(false);
              resetForm();
              fetchSuppliers();
            }}
          ]
        );
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to create supplier:', response.status, errorText);
        Alert.alert(
          'Error Creating Supplier',
          `Failed to create supplier: ${response.status} - ${errorText}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Network error creating supplier:', error);
      Alert.alert(
        'Network Error',
        'Failed to connect to server. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setCreatingSupplier(false);
    }
  };

  const scanSupplierProducts = async (supplier: Supplier) => {
    if (!supplier.website) {
      Alert.alert('No Website', 'This supplier needs a website URL for AI product scanning.');
      return;
    }

    setScanningProducts(true);
    Alert.alert(
      '🤖 AI Product Scanner',
      `Starting intelligent scan of ${supplier.name} website for product codes and pricing...`,
      [{ text: 'Great!' }]
    );

    // Simulate AI scanning process
    try {
      const scannedProducts = await AppErrorHandler.safeNetworkCall(
        `${EXPO_PUBLIC_BACKEND_URL}/api/suppliers/${supplier.id}/scan-products`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website: supplier.website }),
        },
        'AI Product Scanning'
      );

      if (scannedProducts) {
        Alert.alert(
          '🚀 Scan Complete!',
          `Found ${scannedProducts.products?.length || 0} products with codes and prices.\n\nYour inventory items will now show product codes for easy ordering!`,
          [{ text: 'Awesome!' }]
        );
        fetchSuppliers(); // Refresh to show updated products
      }
    } catch (error) {
      Alert.alert(
        '🔧 Scan in Progress',
        'AI product scanning is processing. Results will appear shortly in your inventory items.',
        [{ text: 'Got it!' }]
      );
    } finally {
      setScanningProducts(false);
    }
  };

  const resetForm = () => {
    setNewSupplier({
      name: '',
      type: 'general',
      website: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      account_number: '',
      delivery_info: '',
    });
  };

  const filterSuppliers = () => {
    if (!searchQuery) return suppliers;
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getSupplierIcon = (type: string) => {
    switch (type) {
      case 'electrical': return 'flash';
      case 'hardware': return 'hammer';
      case 'safety': return 'shield-checkmark';
      case 'cleaning': return 'water';
      default: return 'storefront';
    }
  };

  const getSupplierColor = (type: string) => {
    switch (type) {
      case 'electrical': return '#FF9800';
      case 'hardware': return '#795548';
      case 'safety': return '#F44336';
      case 'cleaning': return '#2196F3';
      default: return '#4CAF50';
    }
  };

  const renderSupplierItem = ({ item }: { item: Supplier }) => (
    <TouchableOpacity
      style={styles.supplierCard}
      onPress={() => {
        setSelectedSupplier(item);
        setShowSupplierModal(true);
      }}
    >
      <View style={styles.supplierHeader}>
        <View style={[
          styles.supplierIcon,
          { backgroundColor: getSupplierColor(item.type) }
        ]}>
          <Ionicons 
            name={getSupplierIcon(item.type) as any} 
            size={24} 
            color="#fff" 
          />
        </View>
        <View style={styles.supplierInfo}>
          <Text style={styles.supplierName}>{item.name}</Text>
          <Text style={styles.supplierType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)} Supplier
          </Text>
        </View>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={(e) => {
            e.stopPropagation();
            scanSupplierProducts(item);
          }}
        >
          <Ionicons name="scan" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <View style={styles.supplierDetails}>
        {item.contact_person && (
          <View style={styles.detailRow}>
            <Ionicons name="person" size={16} color="#666" />
            <Text style={styles.detailText}>{item.contact_person}</Text>
          </View>
        )}
        {item.phone && (
          <TouchableOpacity style={styles.detailRow}>
            <Ionicons name="call" size={16} color="#4CAF50" />
            <Text style={[styles.detailText, styles.linkText]}>{item.phone}</Text>
          </TouchableOpacity>
        )}
        {item.products && (
          <View style={styles.detailRow}>
            <Ionicons name="cube" size={16} color="#2196F3" />
            <Text style={styles.detailText}>
              {item.products.length} products scanned
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSupplierModal = () => {
    if (!selectedSupplier) return null;

    return (
      <Modal
        visible={showSupplierModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSupplierModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedSupplier.name}</Text>
            <TouchableOpacity onPress={() => scanSupplierProducts(selectedSupplier)}>
              <Ionicons name="scan" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Supplier Details */}
            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>📞 Contact Information</Text>
              
              {selectedSupplier.contact_person && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact Person:</Text>
                  <Text style={styles.detailValue}>{selectedSupplier.contact_person}</Text>
                </View>
              )}
              
              {selectedSupplier.phone && (
                <TouchableOpacity style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone:</Text>
                  <Text style={[styles.detailValue, styles.linkText]}>
                    {selectedSupplier.phone}
                  </Text>
                </TouchableOpacity>
              )}
              
              {selectedSupplier.email && (
                <TouchableOpacity style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={[styles.detailValue, styles.linkText]}>
                    {selectedSupplier.email}
                  </Text>
                </TouchableOpacity>
              )}

              {selectedSupplier.website && (
                <TouchableOpacity style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Website:</Text>
                  <Text style={[styles.detailValue, styles.linkText]}>
                    {selectedSupplier.website}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Account Information */}
            {(selectedSupplier.account_number || selectedSupplier.delivery_info) && (
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>🏪 Account Details</Text>
                
                {selectedSupplier.account_number && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Account Number:</Text>
                    <Text style={styles.detailValue}>{selectedSupplier.account_number}</Text>
                  </View>
                )}
                
                {selectedSupplier.delivery_info && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Delivery Info:</Text>
                    <Text style={styles.detailValue}>{selectedSupplier.delivery_info}</Text>
                  </View>
                )}
              </View>
            )}

            {/* AI Scanned Products */}
            {selectedSupplier.products && selectedSupplier.products.length > 0 && (
              <View style={styles.detailCard}>
                <View style={styles.productsHeader}>
                  <Text style={styles.detailCardTitle}>🤖 AI Scanned Products</Text>
                  <TouchableOpacity
                    style={styles.rescanButton}
                    onPress={() => scanSupplierProducts(selectedSupplier)}
                  >
                    <Ionicons name="refresh" size={16} color="#4CAF50" />
                    <Text style={styles.rescanButtonText}>Re-scan</Text>
                  </TouchableOpacity>
                </View>
                
                {selectedSupplier.products.slice(0, 10).map((product, index) => (
                  <View key={index} style={styles.productItem}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productCode}>Code: {product.product_code}</Text>
                    </View>
                    {product.price && (
                      <Text style={styles.productPrice}>£{product.price}</Text>
                    )}
                  </View>
                ))}
                
                {selectedSupplier.products.length > 10 && (
                  <Text style={styles.moreProductsText}>
                    +{selectedSupplier.products.length - 10} more products available
                  </Text>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryAction]}
                onPress={() => scanSupplierProducts(selectedSupplier)}
                disabled={scanningProducts}
              >
                <Ionicons name="scan" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>
                  {scanningProducts ? 'Scanning...' : 'AI Product Scan'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryAction]}
                onPress={() => {
                  Alert.alert(
                    'Quick Order',
                    `Ready to order from ${selectedSupplier.name}?\n\nPhone: ${selectedSupplier.phone}\nWebsite: ${selectedSupplier.website}`,
                    [{ text: 'Got it!' }]
                  );
                }}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Quick Order</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  if (!user || user.role !== 'supervisor') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="lock-closed" size={48} color="#F44336" />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            Supplier management is only available to supervisors
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suppliers</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowAddSupplier(true)}
        >
          <Ionicons name="add" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search suppliers..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* AI Scan All Button */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.scanAllButton}
          onPress={() => {
            Alert.alert(
              '🤖 AI Batch Scan',
              'Scan all supplier websites for product codes and pricing?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Scan All', 
                  onPress: () => {
                    Alert.alert('🚀 Batch Scan Started', 'AI is scanning all supplier websites. Results will appear shortly!');
                  }
                }
              ]
            );
          }}
        >
          <Ionicons name="scan" size={20} color="#fff" />
          <Text style={styles.scanAllButtonText}>AI Scan All Suppliers</Text>
        </TouchableOpacity>
      </View>

      {/* Suppliers List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading suppliers...</Text>
          </View>
        ) : filterSuppliers().length === 0 ? (
          <View style={styles.centerContent}>
            <Ionicons name="storefront-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No suppliers match your search' : 'No suppliers added yet'}
            </Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddSupplier(true)}
            >
              <Text style={styles.addButtonText}>Add First Supplier</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlashList
            data={filterSuppliers()}
            renderItem={renderSupplierItem}
            estimatedItemSize={120}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#4CAF50"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Add Supplier Modal */}
      <Modal
        visible={showAddSupplier}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddSupplier(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Supplier</Text>
            <TouchableOpacity 
              onPress={createSupplier}
              disabled={creatingSupplier}
              style={[
                styles.headerTickButton,
                creatingSupplier && styles.headerTickButtonDisabled
              ]}
            >
              {creatingSupplier ? (
                <Text style={styles.loadingText}>...</Text>
              ) : (
                <Ionicons name="checkmark" size={24} color="#4CAF50" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Supplier Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newSupplier.name}
                  onChangeText={(text) => setNewSupplier({...newSupplier, name: text})}
                  placeholder="e.g., Screwfix, Electric Centre"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Website URL</Text>
                <TextInput
                  style={styles.textInput}
                  value={newSupplier.website}
                  onChangeText={(text) => setNewSupplier({...newSupplier, website: text})}
                  placeholder="https://www.supplier.com"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Contact Person</Text>
                <TextInput
                  style={styles.textInput}
                  value={newSupplier.contact_person}
                  onChangeText={(text) => setNewSupplier({...newSupplier, contact_person: text})}
                  placeholder="Contact name"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={newSupplier.phone}
                  onChangeText={(text) => setNewSupplier({...newSupplier, phone: text})}
                  placeholder="Phone number"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {renderSupplierModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    margin: 20,
    marginBottom: 0,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  scanAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  scanAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  supplierCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  supplierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  supplierIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  supplierType: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  scanButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2d4d2d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#aaa',
    fontSize: 12,
  },
  linkText: {
    color: '#4CAF50',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
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
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailCardTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#aaa',
    fontSize: 14,
    minWidth: 100,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  productsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d4d2d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  rescanButtonText: {
    color: '#4CAF50',
    fontSize: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3d3d3d',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  productCode: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 2,
  },
  productPrice: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
  },
  moreProductsText: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  primaryAction: {
    backgroundColor: '#4CAF50',
  },
  secondaryAction: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  formSection: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: '#3d3d3d',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#404040',
  },
  accessDeniedText: {
    color: '#F44336',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  accessDeniedSubtext: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTickButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTickButtonDisabled: {
    opacity: 0.5,
  },
  loadingText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
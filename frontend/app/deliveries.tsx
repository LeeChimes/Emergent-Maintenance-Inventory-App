import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

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
}

interface DeliveryItem {
  item_name: string;
  quantity_expected?: number;
  quantity_received?: number;
  unit: string;
  item_code?: string;
  price_per_unit?: number;
  condition: string;
  notes?: string;
  matched_inventory_id?: string;
  price_per_unit?: number;
}

interface Delivery {
  id: string;
  supplier_id: string;
  supplier_name: string;
  delivery_number: string;
  expected_date?: string;
  delivery_date?: string;
  driver_name?: string;
  tracking_number?: string;
  notes?: string;
  status: 'pending' | 'delivered' | 'partial' | 'cancelled';
  items: DeliveryItem[];
  created_by: string;
  created_at: string;
  delivery_note_photo?: string;
  receiver_name: string;
}

export default function Deliveries() {
  const [user, setUser] = useState<User | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddDelivery, setShowAddDelivery] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showAIProcessing, setShowAIProcessing] = useState(false);
  const [newDelivery, setNewDelivery] = useState({
    supplier_id: '',
    supplier_name: '',
    delivery_number: '',
    expected_date: '',
    driver_name: '',
    tracking_number: '',
    notes: '',
    status: 'pending' as const,
    delivery_note_photo: '',
    receiver_name: '',
    items: [] as DeliveryItem[]
  });

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDeliveries();
      fetchSuppliers();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.push('/');
    }
  };

  const fetchDeliveries = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/deliveries`);
      if (response.ok) {
        const data = await response.json();
        setDeliveries(data);
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      console.log('📋 Fetching suppliers...');
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/suppliers`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Suppliers loaded:', data.length);
        setSuppliers(data);
        
        // Auto-select first supplier if available to make testing easier
        if (data.length > 0 && !newDelivery.supplier_id) {
          setNewDelivery(prev => ({
            ...prev,
            supplier_id: data[0].id,
            supplier_name: data[0].name
          }));
          console.log('🎯 Auto-selected first supplier:', data[0].name);
        }
      } else {
        console.error('❌ Failed to fetch suppliers:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching suppliers:', error);
    }
  };

  // Simplified - manual entry only
  const resetForm = () => {
    setNewDelivery({
      supplier_id: '',
      supplier_name: '',
      delivery_number: '',
      expected_date: '',
      driver_name: '',
      tracking_number: '',
      notes: '',
      status: 'pending',
      delivery_note_photo: '',
      receiver_name: '',
      items: [] as DeliveryItem[]
    });
  };

  const addDeliveryItem = () => {
    setNewDelivery(prev => ({
      ...prev,
      items: [...prev.items, {
        item_name: '',
        quantity_expected: 1,
        quantity_received: 1,
        unit: 'pieces',
        condition: 'good',
        notes: ''
      }]
    }));
  };

  const updateDeliveryItem = (index: number, updates: Partial<DeliveryItem>) => {
    setNewDelivery(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, ...updates } : item
      )
    }));
  };

  const removeDeliveryItem = (index: number) => {
    setNewDelivery(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const createManualDelivery = async () => {
    if (!newDelivery.supplier_id) {
      Alert.alert('Missing Information', 'Please select a supplier.');
      return;
    }

    if (!newDelivery.delivery_number.trim()) {
      Alert.alert('Missing Information', 'Please enter a delivery number.');
      return;
    }

    try {
      const deliveryData = {
        ...newDelivery,
        created_by: user?.id || 'unknown',
        receiver_name: user?.name || 'Unknown'
      };

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deliveryData),
      });

      if (response.ok) {
        Alert.alert('Success', 'Delivery logged successfully!');
        resetForm();
        setShowManualEntry(false);
        setShowAddDelivery(false);
        fetchDeliveries();
      } else {
        const errorData = await response.text();
        console.error('Error creating delivery:', errorData);
        Alert.alert('Error', 'Failed to create delivery. Please try again.');
      }
    } catch (error) {
      console.error('Error creating delivery:', error);
      Alert.alert('Error', 'Failed to create delivery. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading deliveries...</Text>
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
          onPress={() => router.push('/')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deliveries</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="home" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>📦 Delivery Management</Text>
          <Text style={styles.welcomeText}>
            Track and manage all deliveries to the shopping centre. Log new deliveries, 
            view delivery history, and manage inventory updates.
          </Text>
        </View>

        {/* Recent Deliveries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Deliveries</Text>
          {deliveries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#666" />
              <Text style={styles.emptyStateText}>No deliveries logged yet</Text>
              <Text style={styles.emptyStateSubtext}>Tap the + button to log your first delivery</Text>
            </View>
          ) : (
            deliveries.slice(0, 5).map((delivery) => (
              <TouchableOpacity
                key={delivery.id}
                style={styles.deliveryCard}
                onPress={() => {
                  setSelectedDelivery(delivery);
                  setShowDeliveryDetails(true);
                }}
              >
                <View style={styles.deliveryHeader}>
                  <View style={styles.deliveryInfo}>
                    <Text style={styles.deliveryNumber}>#{delivery.delivery_number}</Text>
                    <Text style={styles.supplierName}>{delivery.supplier_name}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
                    <Text style={styles.statusText}>{delivery.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.deliveryDate}>
                  {new Date(delivery.created_at).toLocaleDateString()}
                </Text>
                <Text style={styles.itemCount}>
                  {delivery.items.length} item{delivery.items.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setShowAddDelivery(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Delivery Modal */}
      <Modal
        visible={showAddDelivery}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddDelivery(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddDelivery(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Log New Delivery</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>📦 Select Supplier</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.supplierSelector}>
                {suppliers.map(supplier => (
                  <TouchableOpacity
                    key={supplier.id}
                    style={[
                      styles.supplierChip,
                      newDelivery.supplier_id === supplier.id && styles.supplierChipSelected
                    ]}
                    onPress={() => setNewDelivery(prev => ({
                      ...prev,
                      supplier_id: supplier.id,
                      supplier_name: supplier.name
                    }))}
                  >
                    <Text style={[
                      styles.supplierChipText,
                      newDelivery.supplier_id === supplier.id && styles.supplierChipTextSelected
                    ]}>
                      {supplier.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>📋 Delivery Entry</Text>
              
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => setShowManualEntry(true)}
              >
                <Ionicons name="create" size={24} color="#FF9800" />
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>✍️ Manual Entry</Text>
                  <Text style={styles.optionDescription}>Enter delivery details manually</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualEntry}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowManualEntry(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowManualEntry(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Manual Delivery Entry</Text>
            <TouchableOpacity onPress={createManualDelivery}>
              <Ionicons name="checkmark" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Basic Info */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>📦 Delivery Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Delivery Number *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter delivery number"
                  value={newDelivery.delivery_number}
                  onChangeText={(text) => setNewDelivery(prev => ({ ...prev, delivery_number: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Driver Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter driver name"
                  value={newDelivery.driver_name}
                  onChangeText={(text) => setNewDelivery(prev => ({ ...prev, driver_name: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tracking Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter tracking number"
                  value={newDelivery.tracking_number}
                  onChangeText={(text) => setNewDelivery(prev => ({ ...prev, tracking_number: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Additional notes about the delivery..."
                  value={newDelivery.notes}
                  onChangeText={(text) => setNewDelivery(prev => ({ ...prev, notes: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Items */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📋 Delivered Items</Text>
                <TouchableOpacity style={styles.addButton} onPress={addDeliveryItem}>
                  <Ionicons name="add" size={20} color="#4CAF50" />
                  <Text style={styles.addButtonText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {newDelivery.items.map((item, index) => (
                <View key={index} style={styles.itemForm}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemNumber}>Item {index + 1}</Text>
                    <TouchableOpacity onPress={() => removeDeliveryItem(index)}>
                      <Ionicons name="trash" size={20} color="#F44336" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Item Name *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter item name"
                      value={item.item_name}
                      onChangeText={(text) => updateDeliveryItem(index, { item_name: text })}
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View style={styles.inputHalf}>
                      <Text style={styles.inputLabel}>Quantity</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="0"
                        value={item.quantity_received?.toString() || ''}
                        onChangeText={(text) => updateDeliveryItem(index, { quantity_received: parseInt(text) || 0 })}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.inputHalf}>
                      <Text style={styles.inputLabel}>Unit</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="pieces"
                        value={item.unit}
                        onChangeText={(text) => updateDeliveryItem(index, { unit: text })}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Item Code</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter item code (optional)"
                      value={item.item_code || ''}
                      onChangeText={(text) => updateDeliveryItem(index, { item_code: text })}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Condition</Text>
                    <View style={styles.conditionButtons}>
                      {['good', 'damaged', 'defective'].map((conditionOption) => (
                        <TouchableOpacity
                          key={conditionOption}
                          style={[
                            styles.conditionButton,
                            item.condition === conditionOption && styles.conditionButtonSelected
                          ]}
                          onPress={() => updateDeliveryItem(index, { condition: conditionOption })}
                        >
                          <Text style={[
                            styles.conditionButtonText,
                            item.condition === conditionOption && styles.conditionButtonTextSelected
                          ]}>
                            {conditionOption.charAt(0).toUpperCase() + conditionOption.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Notes</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Item-specific notes..."
                      value={item.notes || ''}
                      onChangeText={(text) => updateDeliveryItem(index, { notes: text })}
                    />
                  </View>
                </View>
              ))}

              {newDelivery.items.length === 0 && (
                <View style={styles.emptyItems}>
                  <Ionicons name="cube-outline" size={32} color="#666" />
                  <Text style={styles.emptyItemsText}>No items added yet</Text>
                  <Text style={styles.emptyItemsSubtext}>Tap "Add Item" to start</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Delivery Details Modal */}
      <Modal
        visible={showDeliveryDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDeliveryDetails(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDeliveryDetails(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Delivery Details</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedDelivery && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>#{selectedDelivery.delivery_number}</Text>
                <Text style={styles.detailsSupplier}>{selectedDelivery.supplier_name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedDelivery.status) }]}>
                  <Text style={styles.statusText}>{selectedDelivery.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.detailsInfo}>
                <Text style={styles.detailsLabel}>Driver:</Text>
                <Text style={styles.detailsValue}>{selectedDelivery.driver_name || 'Not specified'}</Text>
              </View>

              <View style={styles.detailsInfo}>
                <Text style={styles.detailsLabel}>Tracking:</Text>
                <Text style={styles.detailsValue}>{selectedDelivery.tracking_number || 'Not provided'}</Text>
              </View>

              <View style={styles.detailsInfo}>
                <Text style={styles.detailsLabel}>Date:</Text>
                <Text style={styles.detailsValue}>{new Date(selectedDelivery.created_at).toLocaleDateString()}</Text>
              </View>

              {selectedDelivery.notes && (
                <View style={styles.detailsInfo}>
                  <Text style={styles.detailsLabel}>Notes:</Text>
                  <Text style={styles.detailsValue}>{selectedDelivery.notes}</Text>
                </View>
              )}

              <View style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>Items Delivered</Text>
                {selectedDelivery.items.map((item, index) => (
                  <View key={index} style={styles.deliveredItem}>
                    <Text style={styles.itemName}>{item.item_name}</Text>
                    <Text style={styles.itemDetails}>
                      Qty: {item.quantity_received} {item.unit} • Condition: {item.condition}
                    </Text>
                    {item.notes && (
                      <Text style={styles.itemNotes}>{item.notes}</Text>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered': return '#4CAF50';
    case 'pending': return '#FF9800';
    case 'partial': return '#2196F3';
    case 'cancelled': return '#F44336';
    default: return '#666';
  }
};

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
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
  deliveryCard: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  supplierName: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deliveryDate: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  itemCount: {
    color: '#ccc',
    fontSize: 12,
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
    marginBottom: 24,
    marginTop: 16,
  },
  supplierSelector: {
    marginTop: 8,
  },
  supplierChip: {
    backgroundColor: '#404040',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#555',
  },
  supplierChipSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  supplierChipText: {
    color: '#ccc',
    fontSize: 14,
  },
  supplierChipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  optionContent: {
    marginLeft: 12,
    flex: 1,
  },
  optionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  optionDescription: {
    color: '#999',
    fontSize: 14,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#404040',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  itemForm: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#404040',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemNumber: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  conditionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  conditionButton: {
    flex: 1,
    backgroundColor: '#404040',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  conditionButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  conditionButtonText: {
    color: '#ccc',
    fontSize: 14,
  },
  conditionButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyItems: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  emptyItemsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptyItemsSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  detailsSection: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 12,
    marginVertical: 16,
    alignItems: 'center',
  },
  detailsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsSupplier: {
    color: '#4CAF50',
    fontSize: 16,
    marginBottom: 12,
  },
  detailsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  detailsLabel: {
    color: '#999',
    fontSize: 14,
  },
  detailsValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemsSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  deliveredItem: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDetails: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  itemNotes: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
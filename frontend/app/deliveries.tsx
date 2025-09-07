import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface User {
  id: string;
  name: string;
  role: string;
}

interface Supplier {
  id: string;
  name: string;
  type: string;
  website?: string;
  products: any[];
}

interface DeliveryItem {
  item_name: string;
  item_code?: string;
  quantity_expected: number;
  quantity_received: number;
  unit: string;
  condition: string;
  notes?: string;
  matched_inventory_id?: string;
  price_per_unit?: number;
}

interface Delivery {
  id: string;
  delivery_number?: string;
  supplier_id: string;
  supplier_name: string;
  status: string;
  expected_date?: string;
  actual_delivery_date?: string;
  driver_name?: string;
  receiver_name: string;
  items: DeliveryItem[];
  delivery_note_photo?: string;
  ai_extracted_data?: any;
  ai_confidence_score?: number;
  user_confirmed: boolean;
  total_items_expected: number;
  total_items_received: number;
  created_at: string;
  created_by: string;
}

export default function Deliveries() {
  const [user, setUser] = useState<User | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [showAddDelivery, setShowAddDelivery] = useState(false);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [showAIProcessing, setShowAIProcessing] = useState(false);
  
  // Form states
  const [newDelivery, setNewDelivery] = useState({
    supplier_id: '',
    supplier_name: '',
    delivery_number: '',
    expected_date: '',
    driver_name: '',
    tracking_number: '',
    delivery_note_photo: '',
    receiver_name: '',
    items: [] as DeliveryItem[]
  });
  
  const [processingAI, setProcessingAI] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);

  useEffect(() => {
    loadUserAndData();
  }, []);

  const loadUserAndData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setNewDelivery(prev => ({ ...prev, receiver_name: parsedUser.name }));
      } else {
        router.replace('/');
        return;
      }
      
      await Promise.all([fetchDeliveries(), fetchSuppliers()]);
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/');
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
      setRefreshing(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/suppliers`);
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDeliveries();
  };

  const resetDeliveryForm = () => {
    setNewDelivery({
      supplier_id: '',
      supplier_name: '',
      delivery_number: '',
      expected_date: '',
      driver_name: '',
      tracking_number: '',
      delivery_note_photo: '',
      receiver_name: user?.name || '',
      items: []
    });
    setAiResults(null);
  };

  const takeDeliveryNotePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos of delivery notes.');
        return;
      }

      Alert.alert(
        '📸 Delivery Note Photo',
        'Take a clear photo of the delivery note for AI processing',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: openCamera },
          { text: 'Choose from Gallery', onPress: openGallery }
        ]
      );
    } catch (error) {
      console.error('Error requesting camera permission:', error);
    }
  };

  const openCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setNewDelivery(prev => ({
          ...prev,
          delivery_note_photo: result.assets[0].base64
        }));
        
        Alert.alert(
          '🤖 AI Processing Available',
          'Would you like AI to automatically extract delivery information from this photo?',
          [
            { text: 'Manual Entry', style: 'cancel' },
            { text: 'Use AI', onPress: () => setShowAIProcessing(true) }
          ]
        );
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const openGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setNewDelivery(prev => ({
          ...prev,
          delivery_note_photo: result.assets[0].base64
        }));
        
        Alert.alert(
          '🤖 AI Processing Available',
          'Would you like AI to automatically extract delivery information from this photo?',
          [
            { text: 'Manual Entry', style: 'cancel' },
            { text: 'Use AI', onPress: () => setShowAIProcessing(true) }
          ]
        );
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
    }
  };

  const processWithAI = async () => {
    if (!newDelivery.delivery_note_photo) {
      Alert.alert('No Photo', 'Please take a photo of the delivery note first.');
      return;
    }

    setProcessingAI(true);
    
    try {
      // First create the delivery
      const deliveryResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDelivery,
          created_by: user?.id || 'unknown'
        }),
      });

      if (!deliveryResponse.ok) {
        throw new Error('Failed to create delivery');
      }

      const createdDelivery = await deliveryResponse.json();

      // Process with AI
      const aiResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/deliveries/${createdDelivery.id}/process-delivery-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_note_photo: newDelivery.delivery_note_photo,
          user_id: user?.id || 'unknown'
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        setAiResults(aiData);
        
        Alert.alert(
          '🎉 AI Processing Complete!',
          `AI extracted ${aiData.extracted_data?.items?.length || 0} items with ${Math.round((aiData.confidence_score || 0) * 100)}% confidence.\n\nPlease review and confirm the details.`,
          [{ text: 'Review Results', onPress: () => setShowAIProcessing(false) }]
        );
      } else {
        throw new Error('AI processing failed');
      }
      
      await fetchDeliveries();
      
    } catch (error) {
      console.error('Error processing with AI:', error);
      Alert.alert('AI Processing Failed', 'AI processing failed. You can still enter delivery details manually.');
    } finally {
      setProcessingAI(false);
    }
  };

  const createDelivery = async () => {
    if (!newDelivery.supplier_id) {
      Alert.alert('Missing Information', 'Please select a supplier.');
      return;
    }

    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDelivery,
          created_by: user?.id || 'unknown'
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Success! 📦',
          'Delivery has been logged successfully.',
          [{ text: 'OK', onPress: () => {
            setShowAddDelivery(false);
            resetDeliveryForm();
            fetchDeliveries();
          }}]
        );
      } else {
        throw new Error('Failed to create delivery');
      }
    } catch (error) {
      console.error('Error creating delivery:', error);
      Alert.alert('Error', 'Failed to create delivery. Please try again.');
    }
  };

  const confirmDeliveryItems = async (confirmedItems: DeliveryItem[]) => {
    if (!selectedDelivery) return;

    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/deliveries/${selectedDelivery.id}/confirm-and-update-inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmed_items: confirmedItems,
          user_id: user?.id,
          user_name: user?.name
        }),
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert(
          '✅ Inventory Updated!',
          `Successfully updated ${result.materials_updated} materials and ${result.tools_updated} tools.`,
          [{ text: 'Great!', onPress: () => {
            setShowDeliveryDetails(false);
            fetchDeliveries();
          }}]
        );
      }
    } catch (error) {
      console.error('Error confirming delivery:', error);
      Alert.alert('Error', 'Failed to update inventory. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'in_transit': return '#2196F3';
      case 'delivered': return '#4CAF50';
      case 'completed': return '#009688';
      case 'damaged': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'in_transit': return 'car-outline';
      case 'delivered': return 'checkmark-circle-outline';
      case 'completed': return 'checkmark-done-circle';
      case 'damaged': return 'warning-outline';
      default: return 'help-circle-outline';
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = !searchQuery || 
      delivery.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.delivery_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.driver_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.receiver_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading deliveries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Deliveries</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/dashboard')}
          >
            <Ionicons name="home" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowAddDelivery(true)}
          >
            <Ionicons name="add" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search deliveries..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'pending', 'in_transit', 'delivered', 'completed'].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filterStatus === status && styles.filterChipActive
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[
                styles.filterChipText,
                filterStatus === status && styles.filterChipTextActive
              ]}>
                {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Deliveries List */}
      <ScrollView
        style={styles.deliveriesList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredDeliveries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#666" />
            <Text style={styles.emptyStateTitle}>No Deliveries Found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Tap + to log your first delivery'
              }
            </Text>
          </View>
        ) : (
          filteredDeliveries.map((delivery) => (
            <TouchableOpacity
              key={delivery.id}
              style={styles.deliveryCard}
              onPress={() => {
                setSelectedDelivery(delivery);
                setShowDeliveryDetails(true);
              }}
            >
              <View style={styles.deliveryCardHeader}>
                <View style={styles.deliveryInfo}>
                  <Text style={styles.supplierName}>{delivery.supplier_name}</Text>
                  {delivery.delivery_number && (
                    <Text style={styles.deliveryNumber}>#{delivery.delivery_number}</Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
                  <Ionicons name={getStatusIcon(delivery.status)} size={16} color="#fff" />
                  <Text style={styles.statusText}>{delivery.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.deliveryDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="person" size={16} color="#666" />
                  <Text style={styles.detailText}>Received by: {delivery.receiver_name}</Text>
                </View>
                
                {delivery.driver_name && (
                  <View style={styles.detailRow}>
                    <Ionicons name="car" size={16} color="#666" />
                    <Text style={styles.detailText}>Driver: {delivery.driver_name}</Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Ionicons name="cube" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    Items: {delivery.total_items_received}/{delivery.total_items_expected}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {new Date(delivery.created_at).toLocaleDateString()}
                  </Text>
                </View>

                {delivery.ai_confidence_score && (
                  <View style={styles.detailRow}>
                    <Ionicons name="brain" size={16} color="#4CAF50" />
                    <Text style={styles.detailText}>
                      AI Processed ({Math.round(delivery.ai_confidence_score * 100)}% confidence)
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

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
            <TouchableOpacity onPress={createDelivery}>
              <Ionicons name="checkmark" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Supplier Selection */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>📦 Delivery Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Supplier *</Text>
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

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Delivery Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter delivery/reference number"
                  placeholderTextColor="#aaa"
                  value={newDelivery.delivery_number}
                  onChangeText={(text) => setNewDelivery(prev => ({ ...prev, delivery_number: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Driver Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter driver's name"
                  placeholderTextColor="#aaa"
                  value={newDelivery.driver_name}
                  onChangeText={(text) => setNewDelivery(prev => ({ ...prev, driver_name: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tracking Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter tracking number (optional)"
                  placeholderTextColor="#aaa"
                  value={newDelivery.tracking_number}
                  onChangeText={(text) => setNewDelivery(prev => ({ ...prev, tracking_number: text }))}
                />
              </View>
            </View>

            {/* Photo Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>📸 Delivery Documentation</Text>
              
              <TouchableOpacity style={styles.photoButton} onPress={takeDeliveryNotePhoto}>
                <Ionicons name="camera" size={24} color="#4CAF50" />
                <Text style={styles.photoButtonText}>
                  {newDelivery.delivery_note_photo ? 'Photo Captured ✓' : 'Take Photo of Delivery Note'}
                </Text>
              </TouchableOpacity>

              {newDelivery.delivery_note_photo && (
                <View style={styles.photoPreview}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${newDelivery.delivery_note_photo}` }}
                    style={styles.photoImage}
                  />
                  <View style={styles.photoActions}>
                    <TouchableOpacity
                      style={styles.aiProcessButton}
                      onPress={() => setShowAIProcessing(true)}
                    >
                      <Ionicons name="brain" size={20} color="#fff" />
                      <Text style={styles.aiProcessButtonText}>Process with AI</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* AI Results */}
            {aiResults && (
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>🤖 AI Extracted Information</Text>
                <View style={styles.aiResultsContainer}>
                  <Text style={styles.aiConfidence}>
                    Confidence: {Math.round((aiResults.confidence_score || 0) * 100)}%
                  </Text>
                  {aiResults.extracted_data?.items?.map((item: any, index: number) => (
                    <View key={index} style={styles.aiItem}>
                      <Text style={styles.aiItemName}>{item.item_name}</Text>
                      <Text style={styles.aiItemDetails}>
                        Qty: {item.quantity} {item.unit} • Code: {item.item_code || 'N/A'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* AI Processing Modal */}
      <Modal
        visible={showAIProcessing}
        animationType="fade"
        transparent={true}
        onRequestClose={() => !processingAI && setShowAIProcessing(false)}
      >
        <View style={styles.aiModalOverlay}>
          <View style={styles.aiModalContent}>
            <Ionicons name="brain" size={48} color="#4CAF50" />
            <Text style={styles.aiModalTitle}>🤖 AI Processing</Text>
            <Text style={styles.aiModalSubtitle}>
              Reading delivery note and extracting item information...
            </Text>
            
            {processingAI ? (
              <ActivityIndicator size="large" color="#4CAF50" style={styles.aiLoader} />
            ) : (
              <View style={styles.aiModalButtons}>
                <TouchableOpacity
                  style={styles.aiModalButton}
                  onPress={() => setShowAIProcessing(false)}
                >
                  <Text style={styles.aiModalButtonText}>Manual Entry</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.aiModalButton, styles.aiModalButtonPrimary]}
                  onPress={processWithAI}
                >
                  <Text style={[styles.aiModalButtonText, styles.aiModalButtonTextPrimary]}>
                    Process with AI
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Delivery Details Modal */}
      {selectedDelivery && (
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
              <View style={styles.headerButton} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.deliveryDetailsContainer}>
                <Text style={styles.detailsTitle}>{selectedDelivery.supplier_name}</Text>
                
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedDelivery.status) }]}>
                  <Ionicons name={getStatusIcon(selectedDelivery.status)} size={16} color="#fff" />
                  <Text style={styles.statusText}>{selectedDelivery.status.toUpperCase()}</Text>
                </View>

                {selectedDelivery.delivery_number && (
                  <Text style={styles.detailsSubtitle}>#{selectedDelivery.delivery_number}</Text>
                )}

                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>📋 Delivery Information</Text>
                  <Text style={styles.detailItem}>Received by: {selectedDelivery.receiver_name}</Text>
                  {selectedDelivery.driver_name && (
                    <Text style={styles.detailItem}>Driver: {selectedDelivery.driver_name}</Text>
                  )}
                  <Text style={styles.detailItem}>
                    Date: {new Date(selectedDelivery.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={styles.detailItem}>
                    Items: {selectedDelivery.total_items_received}/{selectedDelivery.total_items_expected}
                  </Text>
                </View>

                {selectedDelivery.ai_extracted_data && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>🤖 AI Extracted Items</Text>
                    {selectedDelivery.ai_extracted_data.items?.map((item: any, index: number) => (
                      <View key={index} style={styles.itemCard}>
                        <Text style={styles.itemName}>{item.item_name}</Text>
                        <Text style={styles.itemDetails}>
                          Quantity: {item.quantity} {item.unit}
                        </Text>
                        {item.item_code && (
                          <Text style={styles.itemCode}>Code: {item.item_code}</Text>
                        )}
                        {item.notes && (
                          <Text style={styles.itemNotes}>Notes: {item.notes}</Text>
                        )}
                      </View>
                    ))}
                    
                    {!selectedDelivery.user_confirmed && (
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() => confirmDeliveryItems(selectedDelivery.ai_extracted_data.items || [])}
                      >
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.confirmButtonText}>Confirm & Update Inventory</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {selectedDelivery.delivery_note_photo && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.sectionTitle}>📸 Delivery Note Photo</Text>
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${selectedDelivery.delivery_note_photo}` }}
                      style={styles.deliveryPhoto}
                    />
                  </View>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
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
    marginTop: 16,
    fontSize: 16,
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
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#2d2d2d',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#404040',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: '#404040',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#4CAF50',
  },
  filterChipText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  deliveriesList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  deliveryCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  deliveryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deliveryInfo: {
    flex: 1,
  },
  supplierName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  deliveryNumber: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deliveryDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#aaa',
    fontSize: 14,
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
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#404040',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  supplierSelector: {
    flexDirection: 'row',
  },
  supplierChip: {
    backgroundColor: '#404040',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  supplierChipSelected: {
    backgroundColor: '#4CAF50',
  },
  supplierChipText: {
    color: '#aaa',
    fontSize: 14,
  },
  supplierChipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#404040',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  photoPreview: {
    marginTop: 16,
  },
  photoImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  photoActions: {
    marginTop: 12,
  },
  aiProcessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  aiProcessButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiResultsContainer: {
    backgroundColor: '#404040',
    borderRadius: 12,
    padding: 16,
  },
  aiConfidence: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  aiItem: {
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  aiItemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiItemDetails: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  aiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiModalContent: {
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 300,
    width: '80%',
  },
  aiModalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  aiModalSubtitle: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  aiLoader: {
    marginTop: 16,
  },
  aiModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  aiModalButton: {
    backgroundColor: '#404040',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  aiModalButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  aiModalButtonText: {
    color: '#aaa',
    fontSize: 16,
  },
  aiModalButtonTextPrimary: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deliveryDetailsContainer: {
    padding: 16,
  },
  detailsTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsSubtitle: {
    color: '#4CAF50',
    fontSize: 16,
    marginBottom: 16,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailItem: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 8,
  },
  itemCard: {
    backgroundColor: '#404040',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemDetails: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  itemCode: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 4,
  },
  itemNotes: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deliveryPhoto: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'cover',
  },
});
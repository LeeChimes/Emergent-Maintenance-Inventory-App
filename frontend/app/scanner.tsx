import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  Vibration,
  Dimensions,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

interface Material {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  min_stock: number;
  location?: string;
  supplier?: {
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
  };
  photo?: string;
}

interface Tool {
  id: string;
  name: string;
  description?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_order';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  location?: string;
  current_user?: string;
  service_records?: any[];
  photo?: string;
}

export default function Scanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<Material | Tool | null>(null);
  const [itemType, setItemType] = useState<'material' | 'tool' | null>(null);
  const [actionType, setActionType] = useState<'take' | 'restock' | 'checkout' | 'checkin' | null>(null);
  const [quantity, setQuantity] = useState('');
  const [condition, setCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const [quickTakeMode, setQuickTakeMode] = useState(false);
  const [lastScannedLocation, setLastScannedLocation] = useState<string>('');

  // Quick quantity buttons for materials
  const quickQuantities = [1, 2, 5, 10];

  useEffect(() => {
    initializeUser();
    requestCameraPermission();
    loadLastLocation();
  }, []);

  const loadLastLocation = async () => {
    try {
      const location = await AsyncStorage.getItem('lastScannedLocation');
      if (location) {
        setLastScannedLocation(location);
      }
    } catch (error) {
      console.error('Error loading last location:', error);
    }
  };

  const saveLastLocation = async (location: string) => {
    try {
      await AsyncStorage.setItem('lastScannedLocation', location);
      setLastScannedLocation(location);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  useEffect(() => {
    initializeUser();
    requestCameraPermission();
  }, []);

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

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    
    // Vibration feedback for successful scan
    try {
      Vibration.vibrate(100);
    } catch (error) {
      console.log('Vibration not available');
    }
    
    await fetchItemDetails(data);
  };

  const fetchItemDetails = async (itemId: string) => {
    setLoading(true);
    try {
      // Try to fetch as material first
      let response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/materials/${itemId}`);
      if (response.ok) {
        const material = await response.json();
        setCurrentItem(material);
        setItemType('material');
        setShowItemModal(true);
        
        // Save location if available
        if (material.location) {
          await saveLastLocation(material.location);
        }
        
        return;
      }

      // Try to fetch as tool
      response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/tools/${itemId}`);
      if (response.ok) {
        const tool = await response.json();
        setCurrentItem(tool);
        setItemType('tool');
        setShowItemModal(true);
        
        // Save location if available
        if (tool.location) {
          await saveLastLocation(tool.location);
        }
        
        return;
      }

      Alert.alert(
        'Item Not Found 😔',
        'The scanned QR code doesn\'t match any items in our inventory. Double-check the code!',
        [
          { text: 'Try Again', onPress: () => setScanned(false) },
          { text: 'Browse Items', onPress: () => router.push('/inventory') }
        ]
      );
    } catch (error) {
      console.error('Error fetching item details:', error);
      Alert.alert(
        'Connection Problem 📡',
        'Couldn\'t connect to the server. Check your internet connection and try again.',
        [{ text: 'Retry', onPress: () => setScanned(false) }]
      );
    } finally {
      setLoading(false);
    }
  };

  const performQuickTransaction = async (type: 'take' | 'restock', quantity: number) => {
    if (!currentItem || !user) return;

    setLoading(true);
    try {
      const transactionData = {
        item_id: currentItem.id,
        item_type: itemType,
        transaction_type: type,
        user_id: user.id,
        user_name: user.name,
        quantity: quantity,
        notes: `Quick ${type} - ${quantity} items`,
      };

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (response.ok) {
        // Vibration feedback for success
        try {
          Vibration.vibrate([100, 50, 100]);
        } catch (error) {
          console.log('Vibration not available');
        }

        const actionText = type === 'take' ? 'taken' : 'restocked';
        Alert.alert(
          `Success! 🎉`,
          `${quantity} ${(currentItem as Material).unit} of ${currentItem.name} ${actionText} successfully.`,
          [{ text: 'Great!', onPress: closeModal }]
        );
      } else {
        const error = await response.json();
        Alert.alert('Oops! 😅', error.detail || 'Transaction failed. Please try again.');
      }
    } catch (error) {
      console.error('Error creating quick transaction:', error);
      Alert.alert('Connection Issue 📡', 'Could not complete transaction. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowItemModal(false);
    setCurrentItem(null);
    setItemType(null);
    setActionType(null);
    setQuantity('');
    setCondition('good');
    setNotes('');
    setScanned(false);
  };

  const renderMaterialActions = (material: Material) => (
    <View style={styles.actionButtons}>
      <Text style={styles.actionTitle}>🎯 Quick Actions</Text>
      
      {/* Quick Take Buttons */}
      <View style={styles.quickButtonsContainer}>
        <Text style={styles.quickButtonsTitle}>Quick Take:</Text>
        <View style={styles.quickButtonsRow}>
          {quickQuantities.map((qty) => (
            <TouchableOpacity
              key={qty}
              style={styles.quickButton}
              onPress={() => performQuickTransaction('take', qty)}
            >
              <Text style={styles.quickButtonText}>{qty}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.actionButton, styles.customTakeButton]}
        onPress={() => setActionType('take')}
      >
        <Ionicons name="remove-circle" size={24} color="#fff" />
        <Text style={styles.actionButtonText}>Custom Amount</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionButton, styles.restockButton]}
        onPress={() => setActionType('restock')}
      >
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.actionButtonText}>Restock Items</Text>
      </TouchableOpacity>

      {lastScannedLocation && (
        <View style={styles.locationHint}>
          <Ionicons name="location" size={16} color="#4CAF50" />
          <Text style={styles.locationHintText}>
            💡 Last found: {lastScannedLocation}
          </Text>
        </View>
      )}
    </View>
  );

  const handleTransaction = async () => {
    if (!currentItem || !user || !actionType) return;

    if ((actionType === 'take' || actionType === 'restock') && !quantity) {
      Alert.alert('Missing Info 📝', 'Please enter a quantity first!');
      return;
    }

    setLoading(true);
    try {
      const transactionData = {
        item_id: currentItem.id,
        item_type: itemType,
        transaction_type: actionType === 'take' ? 'take' : 
                         actionType === 'restock' ? 'restock' :
                         actionType === 'checkout' ? 'check_out' : 'check_in',
        user_id: user.id,
        user_name: user.name,
        quantity: quantity ? parseInt(quantity) : null,
        condition: (actionType === 'checkin') ? condition : null,
        notes: notes || null,
      };

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (response.ok) {
        // Success vibration
        try {
          Vibration.vibrate([100, 50, 100]);
        } catch (error) {
          console.log('Vibration not available');
        }

        const actionText = actionType === 'take' ? 'taken' : 
                          actionType === 'restock' ? 'restocked' :
                          actionType === 'checkout' ? 'checked out' : 'returned';
        
        Alert.alert(
          'Success! 🎉',
          `${currentItem.name} has been ${actionText} successfully. Great work!`,
          [{ text: 'Awesome!', onPress: closeModal }]
        );
      } else {
        const error = await response.json();
        Alert.alert('Oops! 😅', error.detail || 'Transaction failed. Please try again.');
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      Alert.alert('Connection Issue 📡', 'Could not complete transaction. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderToolActions = (tool: Tool) => (
    <View style={styles.actionButtons}>
      <Text style={styles.actionTitle}>🔧 Tool Actions</Text>
      
      {tool.status === 'available' ? (
        <TouchableOpacity
          style={[styles.actionButton, styles.checkoutButton]}
          onPress={() => setActionType('checkout')}
        >
          <Ionicons name="log-out" size={24} color="#fff" />
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonText}>Check Out Tool</Text>
            <Text style={styles.actionButtonSubtext}>🔧 Take this tool</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.actionButton, styles.checkinButton]}
          onPress={() => setActionType('checkin')}
        >
          <Ionicons name="log-in" size={24} color="#fff" />
          <View style={styles.actionButtonContent}>
            <Text style={styles.actionButtonText}>Return Tool</Text>
            <Text style={styles.actionButtonSubtext}>✅ Bring it back</Text>
          </View>
        </TouchableOpacity>
      )}

      {tool.current_user && (
        <View style={styles.currentUserCard}>
          <Ionicons name="person" size={16} color="#FF9800" />
          <Text style={styles.currentUserText}>
            Currently with: {tool.current_user}
          </Text>
        </View>
      )}

      {lastScannedLocation && (
        <View style={styles.locationHint}>
          <Ionicons name="location" size={16} color="#4CAF50" />
          <Text style={styles.locationHintText}>
            💡 Last found: {lastScannedLocation}
          </Text>
        </View>
      )}
    </View>
  );

  const renderActionForm = () => {
    if (!actionType) return null;

    return (
      <View style={styles.actionForm}>
        {(actionType === 'take' || actionType === 'restock') && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Quantity</Text>
            <TextInput
              style={styles.textInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="Enter quantity"
              placeholderTextColor="#666"
            />
          </View>
        )}

        {actionType === 'checkin' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Condition</Text>
            <View style={styles.conditionButtons}>
              {(['excellent', 'good', 'fair', 'poor'] as const).map((cond) => (
                <TouchableOpacity
                  key={cond}
                  style={[
                    styles.conditionButton,
                    condition === cond && styles.conditionButtonActive
                  ]}
                  onPress={() => setCondition(cond)}
                >
                  <Text style={[
                    styles.conditionButtonText,
                    condition === cond && styles.conditionButtonTextActive
                  ]}>
                    {cond.charAt(0).toUpperCase() + cond.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Notes (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any notes..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.formButtons}>
          <TouchableOpacity
            style={[styles.formButton, styles.cancelButton]}
            onPress={() => setActionType(null)}
          >
            <Text style={styles.formButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.formButton, styles.confirmButton]}
            onPress={handleTransaction}
            disabled={loading}
          >
            <Text style={styles.formButtonText}>
              {loading ? 'Processing...' : 'Confirm'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={64} color="#666" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            To scan QR codes, please allow camera access in your device settings.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
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
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Camera Scanner */}
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={styles.scanner}
        />
        
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerText}>
            Position QR code within the frame
          </Text>
        </View>
      </View>

      {/* Reset Scanner */}
      {scanned && (
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => setScanned(false)}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
          <Text style={styles.resetButtonText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}

      {/* Item Details Modal */}
      <Modal
        visible={showItemModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Item Details</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {currentItem && (
              <>
                <View style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Ionicons 
                      name={itemType === 'material' ? 'cube' : 'build'} 
                      size={32} 
                      color={itemType === 'material' ? '#4CAF50' : '#2196F3'} 
                    />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{currentItem.name}</Text>
                      <Text style={styles.itemType}>
                        {itemType === 'material' ? 'Material' : 'Tool'}
                      </Text>
                    </View>
                  </View>

                  {currentItem.description && (
                    <Text style={styles.itemDescription}>{currentItem.description}</Text>
                  )}

                  <View style={styles.itemDetails}>
                    {itemType === 'material' ? (
                      <>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Current Stock:</Text>
                          <Text style={styles.detailValue}>
                            {(currentItem as Material).quantity} {(currentItem as Material).unit}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Minimum Stock:</Text>
                          <Text style={styles.detailValue}>
                            {(currentItem as Material).min_stock} {(currentItem as Material).unit}
                          </Text>
                        </View>
                        {(currentItem as Material).location && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Location:</Text>
                            <Text style={styles.detailValue}>{(currentItem as Material).location}</Text>
                          </View>
                        )}
                        {(currentItem as Material).supplier && (
                          <View style={styles.supplierInfo}>
                            <Text style={styles.supplierTitle}>Supplier Information</Text>
                            <Text style={styles.supplierDetail}>
                              {(currentItem as Material).supplier!.name}
                            </Text>
                            {(currentItem as Material).supplier!.contact_person && (
                              <Text style={styles.supplierDetail}>
                                Contact: {(currentItem as Material).supplier!.contact_person}
                              </Text>
                            )}
                            {(currentItem as Material).supplier!.phone && (
                              <Text style={styles.supplierDetail}>
                                Phone: {(currentItem as Material).supplier!.phone}
                              </Text>
                            )}
                          </View>
                        )}
                      </>
                    ) : (
                      <>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Status:</Text>
                          <Text style={[
                            styles.detailValue,
                            (currentItem as Tool).status === 'available' ? styles.statusAvailable :
                            (currentItem as Tool).status === 'in_use' ? styles.statusInUse :
                            styles.statusMaintenance
                          ]}>
                            {(currentItem as Tool).status.replace('_', ' ').toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Condition:</Text>
                          <Text style={styles.detailValue}>
                            {(currentItem as Tool).condition.charAt(0).toUpperCase() + 
                             (currentItem as Tool).condition.slice(1)}
                          </Text>
                        </View>
                        {(currentItem as Tool).current_user && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Current User:</Text>
                            <Text style={styles.detailValue}>{(currentItem as Tool).current_user}</Text>
                          </View>
                        )}
                        {(currentItem as Tool).location && (
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Location:</Text>
                            <Text style={styles.detailValue}>{(currentItem as Tool).location}</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>

                {!actionType && (
                  <>
                    <Text style={styles.actionTitle}>What would you like to do?</Text>
                    {itemType === 'material' ? 
                      renderMaterialActions(currentItem as Material) : 
                      renderToolActions(currentItem as Tool)
                    }
                  </>
                )}

                {renderActionForm()}
              </>
            )}
          </ScrollView>
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
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
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
  itemCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemType: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 4,
  },
  itemDescription: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  itemDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statusAvailable: {
    color: '#4CAF50',
  },
  statusInUse: {
    color: '#FF9800',
  },
  statusMaintenance: {
    color: '#F44336',
  },
  supplierInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#3d3d3d',
    borderRadius: 8,
  },
  supplierTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  supplierDetail: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  actionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickButtonsContainer: {
    marginBottom: 16,
  },
  quickButtonsTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 50,
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  customTakeButton: {
    backgroundColor: '#FF9800',
  },
  currentUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4d3d2d',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  currentUserText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '500',
  },
  locationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d4d2d',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  locationHintText: {
    color: '#4CAF50',
    fontSize: 12,
    flex: 1,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  restockButton: {
    backgroundColor: '#4CAF50',
  },
  checkoutButton: {
    backgroundColor: '#FF9800',
  },
  checkinButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionForm: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 20,
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
    backgroundColor: '#3d3d3d',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  conditionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  conditionButton: {
    backgroundColor: '#3d3d3d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3d3d3d',
  },
  conditionButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  conditionButtonText: {
    color: '#aaa',
    fontSize: 12,
  },
  conditionButtonTextActive: {
    color: '#fff',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  formButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  formButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
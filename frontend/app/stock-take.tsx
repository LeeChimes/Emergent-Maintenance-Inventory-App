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
  KeyboardAvoidingView,
  Platform,
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
}

interface Tool {
  id: string;
  name: string;
  description?: string;
  status: string;
  condition: string;
}

interface StockTakeEntry {
  item_id: string;
  item_type: 'material' | 'tool';
  item_name: string;
  counted_quantity: number;
  condition?: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}

export default function StockTake() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedType, setSelectedType] = useState<'material' | 'tool' | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [entries, setEntries] = useState<StockTakeEntry[]>([]);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<Material | Tool | null>(null);
  const [currentItemType, setCurrentItemType] = useState<'material' | 'tool' | null>(null);
  const [countedQuantity, setCountedQuantity] = useState('');
  const [condition, setCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeUser();
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
    if (status === 'granted') {
      setShowScanner(true);
    }
  };

  const startStockTake = (type: 'material' | 'tool') => {
    setSelectedType(type);
    setEntries([]);
    requestCameraPermission();
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    await fetchItemForStockTake(data);
  };

  const fetchItemForStockTake = async (itemId: string) => {
    setLoading(true);
    try {
      // Try to fetch as the selected type first
      const endpoint = selectedType === 'material' ? 'materials' : 'tools';
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/${endpoint}/${itemId}`);
      
      if (response.ok) {
        const item = await response.json();
        setCurrentItem(item);
        setCurrentItemType(selectedType);
        setShowScanner(false);
        setShowEntryModal(true);
        
        // Set default quantity for materials
        if (selectedType === 'material') {
          setCountedQuantity(item.quantity.toString());
        }
      } else {
        Alert.alert(
          'Item Not Found',
          `The scanned QR code does not match any ${selectedType}s in the inventory.`,
          [{ text: 'OK', onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      Alert.alert('Error', 'Could not retrieve item details.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const addStockTakeEntry = () => {
    if (!currentItem || !user) return;

    if (currentItemType === 'material' && !countedQuantity) {
      Alert.alert('Error', 'Please enter the counted quantity.');
      return;
    }

    const entry: StockTakeEntry = {
      item_id: currentItem.id,
      item_type: currentItemType!,
      item_name: currentItem.name,
      counted_quantity: currentItemType === 'material' ? parseInt(countedQuantity) : 1,
      condition: currentItemType === 'tool' ? condition : undefined,
      notes: notes || undefined,
    };

    setEntries(prev => [...prev, entry]);
    setShowEntryModal(false);
    resetEntryForm();
    setScanned(false);
  };

  const resetEntryForm = () => {
    setCurrentItem(null);
    setCurrentItemType(null);
    setCountedQuantity('');
    setCondition('good');
    setNotes('');
  };

  const removeEntry = (index: number) => {
    Alert.alert(
      'Remove Entry',
      'Are you sure you want to remove this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setEntries(prev => prev.filter((_, i) => i !== index)),
        },
      ]
    );
  };

  const completeStockTake = async () => {
    if (entries.length === 0) {
      Alert.alert('Error', 'Please add at least one item to the stock take.');
      return;
    }

    Alert.alert(
      'Complete Stock Take',
      `This will update ${entries.length} items in the inventory. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: submitStockTake,
        },
      ]
    );
  };

  const submitStockTake = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const stockTakeData = {
        user_id: user.id,
        user_name: user.name,
        item_type: selectedType!,
        entries: entries.map(entry => ({
          item_id: entry.item_id,
          item_type: entry.item_type,
          counted_quantity: entry.counted_quantity,
          condition: entry.condition || null,
          notes: entry.notes || null,
        })),
      };

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/stock-takes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockTakeData),
      });

      if (response.ok) {
        Alert.alert(
          'Stock Take Complete',
          `Successfully updated ${entries.length} items in the inventory.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedType(null);
                setEntries([]);
                router.back();
              },
            },
          ]
        );
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to complete stock take.');
      }
    } catch (error) {
      console.error('Error completing stock take:', error);
      Alert.alert('Error', 'Could not complete stock take. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const renderScanner = () => (
    <Modal visible={showScanner} animationType="slide">
      <SafeAreaView style={styles.scannerModal}>
        <View style={styles.scannerHeader}>
          <TouchableOpacity
            onPress={() => {
              setShowScanner(false);
              setScanned(false);
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.scannerTitle}>
            Scan {selectedType === 'material' ? 'Material' : 'Tool'}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setShowScanner(false);
              setShowManualEntry(true);
            }}
          >
            <Ionicons name="create" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {hasPermission === false ? (
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-off" size={64} color="#666" />
            <Text style={styles.permissionText}>Camera permission is required</Text>
          </View>
        ) : (
          <View style={styles.scannerContainer}>
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={styles.scanner}
            />
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame} />
              <Text style={styles.scannerText}>
                Scan {selectedType} QR code
              </Text>
            </View>
          </View>
        )}

        {scanned && (
          <TouchableOpacity
            style={styles.resetScanButton}
            onPress={() => setScanned(false)}
          >
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.resetScanText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderEntryModal = () => (
    <Modal visible={showEntryModal} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView 
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEntryModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Stock Count</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {currentItem && (
              <View style={styles.itemInfoCard}>
                <View style={styles.itemInfoHeader}>
                  <Ionicons 
                    name={currentItemType === 'material' ? 'cube' : 'build'} 
                    size={32} 
                    color={currentItemType === 'material' ? '#4CAF50' : '#2196F3'} 
                  />
                  <View style={styles.itemInfoDetails}>
                    <Text style={styles.itemInfoName}>{currentItem.name}</Text>
                    <Text style={styles.itemInfoType}>
                      {currentItemType === 'material' ? 'Material' : 'Tool'}
                    </Text>
                  </View>
                </View>

                {currentItem.description && (
                  <Text style={styles.itemInfoDescription}>{currentItem.description}</Text>
                )}

                {currentItemType === 'material' && (
                  <Text style={styles.currentStock}>
                    Current Stock: {(currentItem as Material).quantity} {(currentItem as Material).unit}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.formSection}>
              {currentItemType === 'material' ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Counted Quantity *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={countedQuantity}
                    onChangeText={setCountedQuantity}
                    keyboardType="numeric"
                    placeholder="Enter counted quantity"
                    placeholderTextColor="#666"
                  />
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Condition *</Text>
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
                  onPress={() => setShowEntryModal(false)}
                >
                  <Text style={styles.formButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.formButton, styles.addButton]}
                  onPress={addStockTakeEntry}
                  disabled={loading}
                >
                  <Text style={styles.formButtonText}>Add Entry</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!selectedType) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Stock Take</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.content}>
          <View style={styles.introSection}>
            <Ionicons name="clipboard" size={64} color="#4CAF50" />
            <Text style={styles.introTitle}>Stock Take</Text>
            <Text style={styles.introText}>
              Choose what type of items you want to count and update
            </Text>
          </View>

          <View style={styles.typeSelection}>
            <TouchableOpacity
              style={[styles.typeButton, styles.materialButton]}
              onPress={() => startStockTake('material')}
            >
              <Ionicons name="cube" size={32} color="#fff" />
              <Text style={styles.typeButtonText}>Materials</Text>
              <Text style={styles.typeButtonSubtext}>Count quantities</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, styles.toolButton]}
              onPress={() => startStockTake('tool')}
            >
              <Ionicons name="build" size={32} color="#fff" />
              <Text style={styles.typeButtonText}>Tools</Text>
              <Text style={styles.typeButtonSubtext}>Check conditions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            if (entries.length > 0) {
              Alert.alert(
                'Cancel Stock Take',
                'You have unsaved entries. Are you sure you want to cancel?',
                [
                  { text: 'Keep Working', style: 'cancel' },
                  {
                    text: 'Cancel',
                    style: 'destructive',
                    onPress: () => setSelectedType(null),
                  },
                ]
              );
            } else {
              setSelectedType(null);
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedType === 'material' ? 'Materials' : 'Tools'} Stock Take
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => requestCameraPermission()}
        >
          <Ionicons name="qr-code" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            Items Scanned: {entries.length}
          </Text>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => requestCameraPermission()}
          >
            <Ionicons name="qr-code" size={24} color="#fff" />
            <Text style={styles.scanButtonText}>Scan Item</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.entriesList}>
          {entries.map((entry, index) => (
            <View key={index} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Ionicons 
                  name={entry.item_type === 'material' ? 'cube' : 'build'} 
                  size={24} 
                  color={entry.item_type === 'material' ? '#4CAF50' : '#2196F3'} 
                />
                <Text style={styles.entryName}>{entry.item_name}</Text>
                <TouchableOpacity onPress={() => removeEntry(index)}>
                  <Ionicons name="trash" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>

              <View style={styles.entryDetails}>
                {entry.item_type === 'material' ? (
                  <Text style={styles.entryDetail}>
                    Counted: {entry.counted_quantity} pieces
                  </Text>
                ) : (
                  <Text style={styles.entryDetail}>
                    Condition: {entry.condition?.charAt(0).toUpperCase() + entry.condition?.slice(1)}
                  </Text>
                )}
                {entry.notes && (
                  <Text style={styles.entryNotes}>Notes: {entry.notes}</Text>
                )}
              </View>
            </View>
          ))}

          {entries.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="scan" size={48} color="#666" />
              <Text style={styles.emptyText}>No items scanned yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the scan button to start adding items
              </Text>
            </View>
          )}
        </ScrollView>

        {entries.length > 0 && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={completeStockTake}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.completeButtonText}>
              {loading ? 'Processing...' : `Complete Stock Take (${entries.length} items)`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {renderScanner()}
      {renderEntryModal()}
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
  content: {
    flex: 1,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  introSection: {
    alignItems: 'center',
    padding: 40,
  },
  introTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  introText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  typeSelection: {
    padding: 20,
    gap: 16,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    gap: 16,
  },
  materialButton: {
    backgroundColor: '#4CAF50',
  },
  toolButton: {
    backgroundColor: '#2196F3',
  },
  typeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  typeButtonSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    position: 'absolute',
    left: 72,
    bottom: 16,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#2d2d2d',
    margin: 20,
    borderRadius: 12,
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  entriesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  entryCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  entryName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  entryDetails: {
    gap: 4,
  },
  entryDetail: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  entryNotes: {
    color: '#aaa',
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 18,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scannerModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#2d2d2d',
  },
  scannerTitle: {
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
  resetScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  resetScanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
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
  itemInfoCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  itemInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  itemInfoDetails: {
    flex: 1,
  },
  itemInfoName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemInfoType: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 4,
  },
  itemInfoDescription: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  currentStock: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    gap: 20,
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
  addButton: {
    backgroundColor: '#4CAF50',
  },
  formButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
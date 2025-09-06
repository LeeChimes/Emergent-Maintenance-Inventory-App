import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import { captureRef } from 'react-native-view-shot';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

export default function AddItem() {
  const [user, setUser] = useState<User | null>(null);
  const [itemType, setItemType] = useState<'material' | 'tool' | null>(null);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pieces');
  const [minStock, setMinStock] = useState('');
  const [location, setLocation] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');

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

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('');
    setQuantity('');
    setUnit('pieces');
    setMinStock('');
    setLocation('');
    setSupplierName('');
    setSupplierContact('');
    setSupplierPhone('');
    setSupplierEmail('');
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter an item name.');
      return false;
    }

    if (itemType === 'material') {
      if (!quantity || isNaN(parseInt(quantity))) {
        Alert.alert('Invalid Quantity', 'Please enter a valid quantity number.');
        return false;
      }
      if (!minStock || isNaN(parseInt(minStock))) {
        Alert.alert('Invalid Min Stock', 'Please enter a valid minimum stock number.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const endpoint = itemType === 'material' ? 'materials' : 'tools';
      
      let payload: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        location: location.trim() || undefined,
      };

      if (itemType === 'material') {
        payload.quantity = parseInt(quantity);
        payload.unit = unit;
        payload.min_stock = parseInt(minStock);
        
        if (supplierName.trim()) {
          payload.supplier = {
            name: supplierName.trim(),
            contact_person: supplierContact.trim() || undefined,
            phone: supplierPhone.trim() || undefined,
            email: supplierEmail.trim() || undefined,
          };
        }
      } else {
        payload.status = 'available';
        payload.condition = 'good';
      }

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newItem = await response.json();
        Alert.alert(
          'Success! 🎉',
          `${name} has been added to the inventory with QR code ${newItem.qr_code}.`,
          [
            { text: 'Add Another', onPress: () => { resetForm(); setItemType(null); } },
            { text: 'Go to Inventory', onPress: () => router.push('/inventory') },
          ]
        );
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to add item.');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Connection Error', 'Could not connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'supervisor') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="lock-closed" size={48} color="#F44336" />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            Only supervisors can add new items
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

  if (!itemType) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Item</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.centerContent}>
          <View style={styles.welcomeSection}>
            <Ionicons name="add-circle" size={64} color="#4CAF50" />
            <Text style={styles.welcomeTitle}>Add New Item</Text>
            <Text style={styles.welcomeText}>
              What type of item would you like to add?
            </Text>
          </View>

          <View style={styles.typeSelection}>
            <TouchableOpacity
              style={[styles.typeButton, styles.materialButton]}
              onPress={() => setItemType('material')}
            >
              <Ionicons name="cube" size={32} color="#fff" />
              <Text style={styles.typeButtonText}>Material</Text>
              <Text style={styles.typeButtonSubtext}>📦 Stock items with quantities</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, styles.toolButton]}
              onPress={() => setItemType('tool')}
            >
              <Ionicons name="build" size={32} color="#fff" />
              <Text style={styles.typeButtonText}>Tool</Text>
              <Text style={styles.typeButtonSubtext}>🔧 Equipment for check-in/out</Text>
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
          onPress={() => setItemType(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Add {itemType === 'material' ? 'Material' : 'Tool'}
        </Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter item name"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the item (optional)"
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.textInput}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g., Safety Equipment, Electrical"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Where is this stored?"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          {/* Material-specific fields */}
          {itemType === 'material' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Stock Information</Text>
                
                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, styles.inputHalf]}>
                    <Text style={styles.inputLabel}>Initial Quantity *</Text>
                    <TextInput
                      style={styles.textInput}
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder="0"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.inputHalf]}>
                    <Text style={styles.inputLabel}>Unit</Text>
                    <TouchableOpacity style={styles.unitSelector}>
                      <Text style={styles.unitText}>{unit}</Text>
                      <Ionicons name="chevron-down" size={16} color="#aaa" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Minimum Stock Level *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={minStock}
                    onChangeText={setMinStock}
                    placeholder="Alert when below this amount"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏪 Supplier Information</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Supplier Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={supplierName}
                    onChangeText={setSupplierName}
                    placeholder="Company name (optional)"
                    placeholderTextColor="#666"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Contact Person</Text>
                  <TextInput
                    style={styles.textInput}
                    value={supplierContact}
                    onChangeText={setSupplierContact}
                    placeholder="Contact name (optional)"
                    placeholderTextColor="#666"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.textInput}
                    value={supplierPhone}
                    onChangeText={setSupplierPhone}
                    placeholder="Phone number (optional)"
                    placeholderTextColor="#666"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.textInput}
                    value={supplierEmail}
                    onChangeText={setSupplierEmail}
                    placeholder="Email address (optional)"
                    placeholderTextColor="#666"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </>
          )}

          {/* Tool-specific note */}
          {itemType === 'tool' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔧 Tool Information</Text>
              <View style={styles.noteCard}>
                <Ionicons name="information-circle" size={20} color="#4CAF50" />
                <Text style={styles.noteText}>
                  Tools will be set to "Available" status and "Good" condition by default.
                  You can update these later through the inventory management.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.submitButtonText}>
              {loading ? 'Adding Item...' : `Add ${itemType === 'material' ? 'Material' : 'Tool'}`}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
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
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  typeSelection: {
    gap: 16,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
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
    fontSize: 12,
    opacity: 0.9,
    position: 'absolute',
    left: 72,
    bottom: 16,
  },
  keyboardView: {
    flex: 1,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#404040',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  unitSelector: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#404040',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitText: {
    color: '#fff',
    fontSize: 16,
  },
  noteCard: {
    backgroundColor: '#2d4d2d',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  noteText: {
    color: '#4CAF50',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 40,
  },
});
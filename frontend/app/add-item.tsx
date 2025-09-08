import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UniversalHeader from '../components/UniversalHeader';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

export default function AddItem() {
  const [user, setUser] = useState<User | null>(null);
  const [itemType, setItemType] = useState<'material' | 'tool' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedQR, setGeneratedQR] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    current_quantity: '',
    min_stock_level: '',
    max_stock_level: '',
    unit: '',
    location: '',
    supplier: '',
    cost_per_unit: '',
    // Tool-specific fields
    brand: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    warranty_expiry: '',
    maintenance_schedule: '',
  });

  useEffect(() => {
    loadUserData();
  }, []);

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

  const generateQRCode = () => {
    const timestamp = Date.now();
    const prefix = itemType === 'material' ? 'MAT' : 'TOOL';
    return `${prefix}-${timestamp}`;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      current_quantity: '',
      min_stock_level: '',
      max_stock_level: '',
      unit: '',
      location: '',
      supplier: '',
      cost_per_unit: '',
      brand: '',
      model: '',
      serial_number: '',
      purchase_date: '',
      warranty_expiry: '',
      maintenance_schedule: '',
    });
    setItemType(null);
  };

  const handleSubmit = async () => {
    if (!itemType) {
      Alert.alert('Selection Required', 'Please select whether this is a Material or Tool');
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Item name is required');
      return;
    }

    if (!formData.current_quantity || isNaN(Number(formData.current_quantity))) {
      Alert.alert('Validation Error', 'Please enter a valid current quantity');
      return;
    }

    try {
      const qrCode = generateQRCode();
      
      const itemData = {
        ...formData,
        current_quantity: parseInt(formData.current_quantity),
        min_stock_level: formData.min_stock_level ? parseInt(formData.min_stock_level) : null,
        max_stock_level: formData.max_stock_level ? parseInt(formData.max_stock_level) : null,
        cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : null,
        qr_code: qrCode,
        created_by: user?.id,
        status: 'available'
      };

      const endpoint = itemType === 'material' ? '/api/materials' : '/api/tools';
      
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      if (response.ok) {
        setGeneratedQR(qrCode);
        setShowSuccess(true);
      } else {
        const errorData = await response.text();
        console.error('Error adding item:', errorData);
        Alert.alert('Error', 'Failed to add item. Please try again.');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item. Please try again.');
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    resetForm();
    router.push('/inventory');
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Universal Header */}
      <UniversalHeader title="Add New Item" showBackButton={true} />

      <ScrollView style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>➕ Add New Item</Text>
          <Text style={styles.welcomeText}>
            Add materials or tools to the inventory system. Each item will get a unique QR code for easy tracking.
          </Text>
        </View>

        {/* Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What type of item are you adding?</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[styles.typeButton, itemType === 'material' && styles.typeButtonActive]}
              onPress={() => setItemType('material')}
            >
              <Ionicons name="cube" size={32} color={itemType === 'material' ? '#fff' : '#666'} />
              <Text style={[styles.typeButtonText, itemType === 'material' && styles.typeButtonTextActive]}>
                Material
              </Text>
              <Text style={styles.typeButtonSubtext}>
                Consumable items, supplies, parts
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, itemType === 'tool' && styles.typeButtonActive]}
              onPress={() => setItemType('tool')}
            >
              <Ionicons name="hammer" size={32} color={itemType === 'tool' ? '#fff' : '#666'} />
              <Text style={[styles.typeButtonText, itemType === 'tool' && styles.typeButtonTextActive]}>
                Tool
              </Text>
              <Text style={styles.typeButtonSubtext}>
                Equipment, instruments, devices
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        {itemType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Item Details</Text>

            {/* Basic Information */}
            <View style={styles.formGroup}>
              <Text style={styles.groupTitle}>📋 Basic Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Item Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter item name"
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Enter description"
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Safety, Electrical, Plumbing"
                  value={formData.category}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
                />
              </View>
            </View>

            {/* Quantity & Location */}
            <View style={styles.formGroup}>
              <Text style={styles.groupTitle}>📦 Quantity & Location</Text>
              
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Current Quantity *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    value={formData.current_quantity}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, current_quantity: text }))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="pieces, kg, meters"
                    value={formData.unit}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, unit: text }))}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Min Stock Level</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    value={formData.min_stock_level}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, min_stock_level: text }))}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Max Stock Level</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    value={formData.max_stock_level}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, max_stock_level: text }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Storage location"
                  value={formData.location}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
                />
              </View>
            </View>

            {/* Purchase Information */}
            <View style={styles.formGroup}>
              <Text style={styles.groupTitle}>💰 Purchase Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Supplier</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Supplier name"
                  value={formData.supplier}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, supplier: text }))}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cost per Unit</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0.00"
                  value={formData.cost_per_unit}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, cost_per_unit: text }))}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Tool-specific fields */}
            {itemType === 'tool' && (
              <View style={styles.formGroup}>
                <Text style={styles.groupTitle}>🔧 Tool Information</Text>
                
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Brand</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Brand name"
                      value={formData.brand}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, brand: text }))}
                    />
                  </View>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Model</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Model number"
                      value={formData.model}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, model: text }))}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Serial Number</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Serial number"
                    value={formData.serial_number}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, serial_number: text }))}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Purchase Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="YYYY-MM-DD"
                      value={formData.purchase_date}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, purchase_date: text }))}
                    />
                  </View>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>Warranty Expiry</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="YYYY-MM-DD"
                      value={formData.warranty_expiry}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, warranty_expiry: text }))}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Maintenance Schedule</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Monthly, Quarterly, Annually"
                    value={formData.maintenance_schedule}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, maintenance_schedule: text }))}
                  />
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Add {itemType}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.successContent}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            <Text style={styles.successTitle}>Item Added Successfully! 🎉</Text>
            <Text style={styles.successText}>
              Your {itemType} has been added to the inventory with QR code:
            </Text>
            <View style={styles.qrCodeContainer}>
              <Text style={styles.qrCodeText}>{generatedQR}</Text>
            </View>
            <Text style={styles.successNote}>
              You can now find this item in the inventory and scan its QR code for transactions.
            </Text>
            
            <TouchableOpacity style={styles.successButton} onPress={handleSuccessClose}>
              <Text style={styles.successButtonText}>Go to Inventory</Text>
            </TouchableOpacity>
          </View>
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
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  typeButtonSubtext: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
  formGroup: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  groupTitle: {
    color: '#4CAF50',
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
    fontWeight: 'bold',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#404040',
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  successText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrCodeContainer: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  qrCodeText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  successNote: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  successButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
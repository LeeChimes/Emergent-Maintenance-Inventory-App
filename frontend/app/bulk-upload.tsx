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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

export default function BulkUpload() {
  const [user, setUser] = useState<User | null>(null);
  const [itemType, setItemType] = useState<'material' | 'tool' | null>(null);
  const [loading, setLoading] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [results, setResults] = useState<any[]>([]);

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

  const processBulkData = async () => {
    if (!bulkData.trim()) {
      Alert.alert('No Data', 'Please enter some items to upload.');
      return;
    }

    setLoading(true);
    const lines = bulkData.split('\n').filter(line => line.trim());
    const processedItems: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        // Parse CSV-like format: Name, Description, Quantity, Unit, MinStock, Location
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length < 2) {
          errors.push(`Line ${i + 1}: Invalid format (need at least name and description)`);
          continue;
        }

        const itemData: any = {
          name: parts[0],
          description: parts[1] || '',
          category: parts[2] || 'General',
          location: parts[5] || 'Storage Room',
        };

        if (itemType === 'material') {
          itemData.quantity = parseInt(parts[3]) || 0;
          itemData.unit = parts[4] || 'pieces';
          itemData.min_stock = parseInt(parts[5]) || 5;
        } else {
          itemData.status = 'available';
          itemData.condition = 'good';
        }

        const endpoint = itemType === 'material' ? 'materials' : 'tools';
        const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(itemData),
        });

        if (response.ok) {
          const newItem = await response.json();
          processedItems.push({
            name: itemData.name,
            id: newItem.id,
            qr_code: newItem.qr_code,
            success: true,
          });
        } else {
          const error = await response.json();
          errors.push(`${itemData.name}: ${error.detail || 'Failed to create'}`);
        }
      } catch (error) {
        errors.push(`Line ${i + 1}: Processing error - ${error}`);
      }
    }

    setResults(processedItems);
    setLoading(false);

    if (errors.length > 0) {
      Alert.alert(
        'Bulk Upload Complete',
        `Successfully created ${processedItems.length} items.\n${errors.length} errors occurred.`,
        [{ text: 'View Results' }]
      );
    } else {
      Alert.alert(
        'Success! 🎉',
        `Successfully created ${processedItems.length} items with QR codes!`,
        [{ text: 'Great!' }]
      );
    }
  };

  const generateTemplate = () => {
    if (!itemType) return;

    const template = itemType === 'material'
      ? `Safety Helmets,High-visibility safety helmets,Safety Equipment,15,pieces,5,Storage Room A1
LED Light Bulbs,9W warm white LED bulbs,Electrical,50,pieces,10,Electrical Store
Cleaning Supplies,All-purpose cleaner,Maintenance,8,bottles,3,Cleaning Store`
      : `Cordless Drill,18V lithium-ion drill,Power Tools,,,Tool Room C1
Floor Polisher,Commercial floor polisher,Cleaning Equipment,,,Storage Room D1
Safety Harness,Fall protection harness,Safety Equipment,,,Safety Equipment Store`;

    setBulkData(template);
    Alert.alert(
      'Template Loaded! 📋',
      'Edit the template data and tap "Process Bulk Upload" to create multiple items quickly.',
      [{ text: 'Got it!' }]
    );
  };

  if (!user || user.role !== 'supervisor') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="lock-closed" size={48} color="#F44336" />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            Bulk upload is only available to supervisors
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
          <Text style={styles.headerTitle}>Bulk Upload</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.centerContent}>
          <View style={styles.welcomeSection}>
            <Ionicons name="cloud-upload" size={64} color="#4CAF50" />
            <Text style={styles.welcomeTitle}>Bulk Upload Items</Text>
            <Text style={styles.welcomeText}>
              Quickly add hundreds of items at once! Perfect for initial setup.
            </Text>
          </View>

          <View style={styles.typeSelection}>
            <TouchableOpacity
              style={[styles.typeButton, styles.materialButton]}
              onPress={() => setItemType('material')}
            >
              <Ionicons name="cube" size={32} color="#fff" />
              <Text style={styles.typeButtonText}>Bulk Materials</Text>
              <Text style={styles.typeButtonSubtext}>📦 Upload stock items with quantities</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, styles.toolButton]}
              onPress={() => setItemType('tool')}
            >
              <Ionicons name="build" size={32} color="#fff" />
              <Text style={styles.typeButtonText}>Bulk Tools</Text>
              <Text style={styles.typeButtonSubtext}>🔧 Upload equipment for tracking</Text>
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
          Bulk Upload {itemType === 'material' ? 'Materials' : 'Tools'}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={generateTemplate}
        >
          <Ionicons name="document-text" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>📝 How to Bulk Upload</Text>
            <Text style={styles.instructionsText}>
              1. Tap the template button (📄) to load sample data{'\n'}
              2. Edit the data below - one item per line{'\n'}
              3. Format: Name, Description, Category, {itemType === 'material' ? 'Quantity, Unit, MinStock, ' : ''}Location{'\n'}
              4. Tap "Process Bulk Upload" when ready
            </Text>
          </View>

          {/* Bulk Data Input */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Item Data</Text>
              <TouchableOpacity
                style={styles.templateButton}
                onPress={generateTemplate}
              >
                <Ionicons name="document-text" size={16} color="#4CAF50" />
                <Text style={styles.templateButtonText}>Load Template</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.bulkTextInput}
              value={bulkData}
              onChangeText={setBulkData}
              placeholder={`Enter ${itemType} data here...\n\nExample:\nSafety Helmets,High-vis helmets,Safety,15,pieces,5,Storage A1`}
              placeholderTextColor="#666"
              multiline
              numberOfLines={15}
              textAlignVertical="top"
            />
          </View>

          {/* Process Button */}
          <TouchableOpacity
            style={[styles.processButton, loading && styles.processButtonDisabled]}
            onPress={processBulkData}
            disabled={loading}
          >
            <Ionicons name="cloud-upload" size={24} color="#fff" />
            <Text style={styles.processButtonText}>
              {loading ? 'Processing...' : 'Process Bulk Upload'}
            </Text>
          </TouchableOpacity>

          {/* Results */}
          {results.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✅ Upload Results</Text>
              {results.map((item, index) => (
                <View key={index} style={styles.resultItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultQR}>QR Code: {item.qr_code}</Text>
                  </View>
                </View>
              ))}
              
              <TouchableOpacity
                style={styles.printAllButton}
                onPress={() => {
                  Alert.alert(
                    'Print QR Codes',
                    `Ready to print ${results.length} QR code stickers to your Bluetooth printer!`,
                    [
                      { text: 'Cancel' },
                      { text: 'Print All', onPress: () => console.log('Print all QR codes') }
                    ]
                  );
                }}
              >
                <Ionicons name="print" size={20} color="#fff" />
                <Text style={styles.printAllButtonText}>Print All QR Stickers</Text>
              </TouchableOpacity>
            </View>
          )}

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
    lineHeight: 22,
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
  content: {
    flex: 1,
    padding: 20,
  },
  instructionsCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  instructionsTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionsText: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d4d2d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  templateButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  bulkTextInput: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#404040',
    minHeight: 300,
    maxHeight: 400,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  processButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  processButtonDisabled: {
    backgroundColor: '#666',
  },
  processButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultQR: {
    color: '#4CAF50',
    fontSize: 12,
  },
  printAllButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  printAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 40,
  },
});
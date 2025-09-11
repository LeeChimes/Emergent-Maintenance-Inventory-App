import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Screen from './components/Screen';
import Container from './components/Container';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UniversalHeader from '../components/UniversalHeader';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

export default function BulkUpload() {
  const [user, setUser] = useState<User | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const handleBulkUpload = () => {
    Alert.alert(
      'Feature Coming Soon',
      'Bulk upload functionality will be available in a future update. For now, please use the Add Item feature to add items individually.',
      [{ text: 'OK' }]
    );
  };

  const sampleData = [
    {
      title: '📄 CSV Template',
      description: 'Download a CSV template with the correct format for bulk uploads',
      action: 'Download Template',
      icon: 'document-text',
      color: '#4CAF50'
    },
    {
      title: '📊 Excel Template',
      description: 'Download an Excel template for bulk inventory uploads',
      action: 'Download Template',
      icon: 'grid',
      color: '#FF9800'
    },
    {
      title: '📱 Scan Multiple QR',
      description: 'Coming soon: Scan multiple QR codes in sequence',
      action: 'Coming Soon',
      icon: 'qr-code',
      color: '#2196F3'
    },
    {
      title: '📂 Import File',
      description: 'Upload your CSV or Excel file with inventory data',
      action: 'Select File',
      icon: 'cloud-upload',
      color: '#9C27B0'
    }
  ];

  if (!user) {
    return (
      <Screen scroll>
        <Container>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Container>
        {/* Universal Header */}
        <UniversalHeader title="Bulk Upload" showBackButton={true} />

      <ScrollView style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>📦 Bulk Upload</Text>
          <Text style={styles.welcomeText}>
            Import multiple inventory items at once using CSV or Excel files. 
            This feature is coming soon - for now, use individual item creation.
          </Text>
        </View>

        {/* Current Status */}
        <View style={styles.statusSection}>
          <View style={styles.statusCard}>
            <Ionicons name="information-circle" size={32} color="#FF9800" />
            <Text style={styles.statusTitle}>Feature In Development</Text>
            <Text style={styles.statusText}>
              We're working on bulk upload functionality. In the meantime, 
              you can add items individually using the Add Item feature.
            </Text>
          </View>
        </View>

        {/* Upload Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Options (Coming Soon)</Text>
          
          {sampleData.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionCard}
              onPress={handleBulkUpload}
            >
              <View style={[styles.optionIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={24} color="#fff" />
              </View>
              
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{item.title}</Text>
                <Text style={styles.optionDescription}>{item.description}</Text>
              </View>
              
              <View style={styles.optionAction}>
                <Text style={styles.optionActionText}>{item.action}</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Alternatives */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Now</Text>
          
          <TouchableOpacity
            style={styles.alternativeCard}
            onPress={() => router.push('/add-item')}
          >
            <Ionicons name="add-circle" size={32} color="#4CAF50" />
            <View style={styles.alternativeContent}>
              <Text style={styles.alternativeTitle}>Add Individual Items</Text>
              <Text style={styles.alternativeDescription}>
                Add materials and tools one at a time with full details
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alternativeCard}
            onPress={() => router.push('/scanner')}
          >
            <Ionicons name="qr-code" size={32} color="#2196F3" />
            <View style={styles.alternativeContent}>
              <Text style={styles.alternativeTitle}>QR Code Scanner</Text>
              <Text style={styles.alternativeDescription}>
                Scan existing QR codes to manage inventory items
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#2196F3" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.alternativeCard}
            onPress={() => router.push('/inventory')}
          >
            <Ionicons name="list" size={32} color="#FF9800" />
            <View style={styles.alternativeContent}>
              <Text style={styles.alternativeTitle}>View Inventory</Text>
              <Text style={styles.alternativeDescription}>
                Browse and manage your current inventory items
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF9800" />
          </TouchableOpacity>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>💡 Tips for When Bulk Upload is Available</Text>
          
          <View style={styles.tipCard}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.tipText}>
              Prepare your data in CSV format with columns: Name, Description, Category, Quantity, Unit, Location
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.tipText}>
              Use consistent naming conventions for categories and locations
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.tipText}>
              Include supplier information and cost data when available
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.tipText}>
              Test with a small batch first to ensure data formatting is correct
            </Text>
          </View>
        </View>
      </ScrollView>
    </Container>
    </Screen>
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
  statusSection: {
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  statusTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  statusText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    opacity: 0.6,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  optionDescription: {
    color: '#ccc',
    fontSize: 14,
  },
  optionAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionActionText: {
    color: '#666',
    fontSize: 12,
    marginRight: 4,
  },
  alternativeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  alternativeContent: {
    flex: 1,
    marginLeft: 16,
  },
  alternativeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alternativeDescription: {
    color: '#ccc',
    fontSize: 14,
  },
  tipsSection: {
    marginBottom: 32,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  tipText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
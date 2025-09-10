import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import UniversalHeader from '../components/UniversalHeader';

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

export default function EngineerHub() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // If supervisor somehow gets here, redirect to main dashboard
        if (parsedUser.role === 'supervisor') {
          router.replace('/');
          return;
        }
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const navigateToInventory = () => {
    router.push('/inventory');
  };

  const navigateToMaintenance = () => {
    router.push('/maintenance-hub');
  };

  const handleLogout = async () => {
    console.log('🚨 ENGINEER LOGOUT BUTTON CLICKED!'); // Debug log
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      console.log('✅ Engineer logout completed successfully');
      router.replace('/');
    } catch (error) {
      console.error('Engineer logout error:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="cube" size={48} color="#4CAF50" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || user.role !== 'engineer') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Access Denied</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <UniversalHeader 
        title="Engineer Hub" 
        showBackButton={false}
        customRightElement={
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome back, {user.name.split(' ')[0]}! 👋
          </Text>
          <Text style={styles.welcomeSubtext}>
            Choose the area you need to access today
          </Text>
        </View>

        {/* Main Buttons */}
        <View style={styles.buttonsContainer}>
          
          {/* Asset Inventory */}
          <TouchableOpacity 
            style={[styles.sectionButton, styles.inventoryButton]}
            onPress={navigateToInventory}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="cube" size={48} color="#fff" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.sectionTitle}>ASSET INVENTORY</Text>
              <Text style={styles.sectionDescription}>
                📦 Materials, tools, stock levels{'\n'}
                🔍 QR scanning & deliveries
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={32} color="#fff" />
          </TouchableOpacity>

          {/* Maintenance Hub */}
          <TouchableOpacity 
            style={[styles.sectionButton, styles.maintenanceButton]}
            onPress={navigateToMaintenance}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="construct" size={48} color="#fff" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.sectionTitle}>MAINTENANCE HUB</Text>
              <Text style={styles.sectionDescription}>
                🔧 PPMs & reactive jobs{'\n'}
                📞 Call outs & work orders
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={32} color="#fff" />
          </TouchableOpacity>

        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickTitle}>🚀 Quick Actions</Text>
          <View style={styles.quickRow}>
            <TouchableOpacity 
              style={styles.quickButton}
              onPress={() => router.push('/scanner')}
            >
              <Ionicons name="qr-code" size={24} color="#9C27B0" />
              <Text style={styles.quickText}>QR Scanner</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickButton}
              onPress={() => router.push('/help')}
            >
              <Ionicons name="help-circle" size={24} color="#2196F3" />
              <Text style={styles.quickText}>Help</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  errorText: {
    color: '#F44336',
    fontSize: 24,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F44336',
    minWidth: 50,
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  welcomeSection: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtext: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonsContainer: {
    flex: 1,
    gap: 20,
    paddingVertical: 20,
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 20,
    minHeight: 140,
  },
  inventoryButton: {
    backgroundColor: '#4CAF50',
  },
  maintenanceButton: {
    backgroundColor: '#2196F3',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  textContainer: {
    flex: 1,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  quickActions: {
    paddingVertical: 20,
  },
  quickTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickButton: {
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
  },
  quickText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
});
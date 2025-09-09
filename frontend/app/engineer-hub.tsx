import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import UniversalHeader from '../components/UniversalHeader';

const { width } = Dimensions.get('window');

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
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['userToken', 'userData']);
            router.replace('/');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="cube" size={48} color="#4CAF50" />
          <Text style={styles.loadingText}>Loading your workspace... 🚀</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || user.role !== 'engineer') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="lock-closed" size={48} color="#F44336" />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            This area is for engineers only
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header with Logout */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Empty spacer */}
        </View>
        <Text style={styles.headerTitle}>Engineering Hub</Text>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome back, {user.name.split(' ')[0]}! 👋
          </Text>
          <Text style={styles.welcomeSubtext}>
            Choose the area you need to access today
          </Text>
        </View>

        {/* Main Section Buttons */}
        <View style={styles.sectionsContainer}>
          
          {/* Asset Inventory Section */}
          <TouchableOpacity 
            style={[styles.sectionButton, styles.inventoryButton]}
            onPress={navigateToInventory}
          >
            <View style={styles.sectionIconContainer}>
              <Ionicons name="cube" size={48} color="#fff" />
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>ASSET INVENTORY</Text>
              <Text style={styles.sectionDescription}>
                📦 Manage materials, tools, stock levels{'\n'}
                🔍 QR scanning, deliveries, suppliers{'\n'}
                📊 Stock takes and inventory tracking
              </Text>
            </View>
            <View style={styles.sectionArrow}>
              <Ionicons name="chevron-forward" size={32} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Maintenance Hub Section */}
          <TouchableOpacity 
            style={[styles.sectionButton, styles.maintenanceButton]}
            onPress={navigateToMaintenance}
          >
            <View style={styles.sectionIconContainer}>
              <Ionicons name="construct" size={48} color="#fff" />
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.sectionTitle}>MAINTENANCE HUB</Text>
              <Text style={styles.sectionDescription}>
                🔧 Planned preventive maintenance{'\n'}
                📞 Call outs and reactive jobs{'\n'}
                📋 Work orders and scheduling
              </Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>COMING SOON</Text>
              </View>
            </View>
            <View style={styles.sectionArrow}>
              <Ionicons name="chevron-forward" size={32} color="#fff" />
            </View>
          </TouchableOpacity>

        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>🚀 Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/scanner')}
            >
              <Ionicons name="qr-code" size={24} color="#9C27B0" />
              <Text style={styles.quickActionText}>QR Scanner</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/help')}
            >
              <Ionicons name="help-circle" size={24} color="#2196F3" />
              <Text style={styles.quickActionText}>Help</Text>
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
  headerLeft: {
    width: 40, // Same width as logout button for balance
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logoutButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 10,
  },
  accessDeniedText: {
    color: '#F44336',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
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
  sectionsContainer: {
    flex: 1,
    gap: 20,
    paddingVertical: 20,
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 20,
    padding: 20,
    minHeight: 140,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  inventoryButton: {
    backgroundColor: '#4CAF50',
  },
  maintenanceButton: {
    backgroundColor: '#2196F3',
  },
  sectionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  sectionContent: {
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
  comingSoonBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  comingSoonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionArrow: {
    marginLeft: 10,
  },
  quickActionsSection: {
    paddingVertical: 20,
  },
  quickActionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
});
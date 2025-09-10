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
    // For now, just show an alert since maintenance-hub doesn't exist yet
    Alert.alert('Coming Soon', 'Maintenance features will be available soon!');
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
      {/* Header with Logout */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
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
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>COMING SOON</Text>
              </View>
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
    width: 40,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
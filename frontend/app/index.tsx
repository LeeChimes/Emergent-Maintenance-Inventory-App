import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
  created_at: string;
}

interface Stats {
  materials: number;
  tools: number;
  lowStock: number;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ materials: 0, tools: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const initializeApp = async () => {
    try {
      // Check if user is already logged in
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      
      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Fetch available users for login
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/users`);
      const userData = await response.json();
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Could not load users. Please check your connection.');
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch materials count
      const materialsResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/materials`);
      const materials = materialsResponse.ok ? await materialsResponse.json() : [];
      
      // Fetch tools count
      const toolsResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/tools`);
      const tools = toolsResponse.ok ? await toolsResponse.json() : [];

      // Fetch low stock alerts
      const lowStockResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/alerts/low-stock`);
      const lowStockData = lowStockResponse.ok ? await lowStockResponse.json() : { count: 0 };

      setStats({
        materials: materials.length || 0,
        tools: tools.length || 0,
        lowStock: lowStockData.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleLogin = async (userId: string) => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/auth/login?user_id=${userId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const { token, user: userData } = await response.json();
        
        // Store login data
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        setUser(userData);
      } else {
        Alert.alert('Error', 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      Alert.alert('Error', 'Could not connect to server. Please check your connection.');
    }
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
            setUser(null);
            setStats({ materials: 0, tools: 0, lowStock: 0 });
            await fetchUsers();
          },
        },
      ]
    );
  };

  const navigateToScreen = (screen: string) => {
    router.push(`/${screen}` as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Ionicons name="cube" size={48} color="#4CAF50" />
          <Text style={styles.headerTitle}>Asset Inventory</Text>
          <Text style={styles.headerSubtitle}>Chimes Shopping Centre</Text>
        </View>

        <View style={styles.loginSection}>
          <Text style={styles.loginTitle}>Select Your Profile</Text>
          
          {users.map((userData) => (
            <TouchableOpacity
              key={userData.id}
              style={[
                styles.userButton,
                userData.role === 'supervisor' ? styles.supervisorButton : styles.engineerButton
              ]}
              onPress={() => handleLogin(userData.id)}
            >
              <View style={styles.userButtonContent}>
                <Ionicons
                  name={userData.role === 'supervisor' ? 'person-circle' : 'person'}
                  size={24}
                  color="#fff"
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userData.name}</Text>
                  <Text style={styles.userRole}>
                    {userData.role === 'supervisor' ? 'Supervisor' : 'Engineer'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="cube" size={32} color="#4CAF50" />
          <View>
            <Text style={styles.headerTitle}>Asset Inventory</Text>
            <Text style={styles.welcomeText}>Welcome, {user.name}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Main Action Buttons */}
      <View style={styles.mainActions}>
        {user.role === 'supervisor' && (
          <>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => navigateToScreen('dashboard')}
            >
              <Ionicons name="analytics" size={32} color="#fff" />
              <Text style={styles.actionButtonText}>Dashboard</Text>
              <Text style={styles.actionButtonSubtext}>View Reports & Alerts</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.addButton]}
              onPress={() => navigateToScreen('add-item')}
            >
              <Ionicons name="add-circle" size={32} color="#fff" />
              <Text style={styles.actionButtonText}>Add New Item</Text>
              <Text style={styles.actionButtonSubtext}>Materials & Tools</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity 
          style={[styles.actionButton, styles.scanButton]}
          onPress={() => navigateToScreen('scanner')}
        >
          <Ionicons name="qr-code" size={32} color="#fff" />
          <Text style={styles.actionButtonText}>Scan QR Code</Text>
          <Text style={styles.actionButtonSubtext}>Quick Item Access</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.inventoryButton]}
          onPress={() => navigateToScreen('inventory')}
        >
          <Ionicons name="list" size={32} color="#fff" />
          <Text style={styles.actionButtonText}>View Inventory</Text>
          <Text style={styles.actionButtonSubtext}>Browse All Items</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.stockTakeButton]}
          onPress={() => navigateToScreen('stock-take')}
        >
          <Ionicons name="clipboard" size={32} color="#fff" />
          <Text style={styles.actionButtonText}>Stock Take</Text>
          <Text style={styles.actionButtonSubtext}>Count & Update</Text>
        </TouchableOpacity>

        {user.role === 'supervisor' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.settingsButton]}
            onPress={() => navigateToScreen('settings')}
          >
            <Ionicons name="settings" size={32} color="#fff" />
            <Text style={styles.actionButtonText}>Settings</Text>
            <Text style={styles.actionButtonSubtext}>App Configuration</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <Text style={styles.quickStatsTitle}>Quick Overview</Text>
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigateToScreen('inventory')}
          >
            <Ionicons name="cube-outline" size={24} color="#4CAF50" />
            <Text style={styles.statNumber}>{stats.materials}</Text>
            <Text style={styles.statLabel}>Materials</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => navigateToScreen('inventory')}
          >
            <Ionicons name="build-outline" size={24} color="#2196F3" />
            <Text style={styles.statNumber}>{stats.tools}</Text>
            <Text style={styles.statLabel}>Tools</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.statCard, stats.lowStock > 0 && styles.alertStatCard]}
            onPress={() => user.role === 'supervisor' && navigateToScreen('dashboard')}
          >
            <Ionicons 
              name="warning-outline" 
              size={24} 
              color={stats.lowStock > 0 ? "#FF9800" : "#666"} 
            />
            <Text style={[
              styles.statNumber,
              stats.lowStock > 0 && styles.alertStatNumber
            ]}>
              {stats.lowStock}
            </Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </TouchableOpacity>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#aaa',
    fontSize: 14,
  },
  welcomeText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  logoutButton: {
    padding: 8,
  },
  loginSection: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  loginTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  userButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  supervisorButton: {
    backgroundColor: '#4CAF50',
  },
  engineerButton: {
    backgroundColor: '#2196F3',
  },
  userButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userRole: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  mainActions: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  actionButton: {
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 80,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  addButton: {
    backgroundColor: '#2196F3',
  },
  scanButton: {
    backgroundColor: '#9C27B0',
  },
  inventoryButton: {
    backgroundColor: '#FF9800',
  },
  stockTakeButton: {
    backgroundColor: '#795548',
  },
  settingsButton: {
    backgroundColor: '#607D8B',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  actionButtonSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    position: 'absolute',
    left: 68,
    bottom: 16,
  },
  quickStats: {
    padding: 20,
    backgroundColor: '#2d2d2d',
  },
  quickStatsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    gap: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3d3d3d',
    minWidth: 80,
  },
  alertStatCard: {
    backgroundColor: '#4d3d2d',
  },
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  alertStatNumber: {
    color: '#FF9800',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 12,
  },
});
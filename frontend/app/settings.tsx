import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import UniversalHeader from '../components/UniversalHeader';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    initializeUser();
    loadSettings();
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

  const loadSettings = async () => {
    try {
      const vibration = await AsyncStorage.getItem('vibrationEnabled');
      const sound = await AsyncStorage.getItem('soundEnabled');
      const notifications = await AsyncStorage.getItem('notificationsEnabled');
      
      if (vibration !== null) setVibrationEnabled(JSON.parse(vibration));
      if (sound !== null) setSoundEnabled(JSON.parse(sound));
      if (notifications !== null) setNotificationsEnabled(JSON.parse(notifications));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSetting = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const handleVibrationToggle = (value: boolean) => {
    setVibrationEnabled(value);
    saveSetting('vibrationEnabled', value);
  };

  const handleSoundToggle = (value: boolean) => {
    setSoundEnabled(value);
    saveSetting('soundEnabled', value);
  };

  const handleNotificationsToggle = (value: boolean) => {
    setNotificationsEnabled(value);
    saveSetting('notificationsEnabled', value);
  };

  const handleLogout = async () => {
    try {
      // Clear user data
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      // Navigate back to main login screen
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
      // Force navigation even if there's an error
      router.replace('/');
    }
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset App Data',
      'This will clear all app settings and log you out. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'Asset Inventory App',
      'Version 1.0.0\n\nBuilt for Chimes Shopping Centre maintenance team.\n\nDeveloped with ❤️ using React Native and Expo.',
      [{ text: 'OK' }]
    );
  };

  if (!user || user.role !== 'supervisor') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="lock-closed" size={48} color="#F44336" />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            Settings are only accessible to supervisors
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Universal Header */}
      <UniversalHeader title="Settings" showBackButton={true} />

      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.section}>
          <View style={styles.userCard}>
            <View style={styles.userIconContainer}>
              <Ionicons name="person-circle" size={48} color="#4CAF50" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>
                {user.role === 'supervisor' ? '⭐ Supervisor' : '🔧 Engineer'}
              </Text>
            </View>
          </View>
        </View>

        {/* App Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 App Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="vibrate" size={20} color="#4CAF50" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Vibration Feedback</Text>
                <Text style={styles.settingDescription}>
                  Vibrate on successful scans and actions
                </Text>
              </View>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={handleVibrationToggle}
              trackColor={{ false: '#666', true: '#4CAF50' }}
              thumbColor={vibrationEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="volume-high" size={20} color="#2196F3" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Sound Effects</Text>
                <Text style={styles.settingDescription}>
                  Play sounds for app interactions
                </Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={handleSoundToggle}
              trackColor={{ false: '#666', true: '#4CAF50' }}
              thumbColor={soundEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={20} color="#FF9800" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Low Stock Notifications</Text>
                <Text style={styles.settingDescription}>
                  Get alerts when items are running low
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationsToggle}
              trackColor={{ false: '#666', true: '#4CAF50' }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/inventory')}
          >
            <Ionicons name="refresh-circle" size={24} color="#4CAF50" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Refresh Inventory Data</Text>
              <Text style={styles.actionDescription}>Force sync with server</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/dashboard')}
          >
            <Ionicons name="analytics" size={24} color="#2196F3" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>View Reports</Text>
              <Text style={styles.actionDescription}>Check inventory status</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/add-item')}
          >
            <Ionicons name="add-circle" size={24} color="#4CAF50" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Add New Items</Text>
              <Text style={styles.actionDescription}>Materials and tools</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* Supervisor-only User Management */}
          {user?.role === 'supervisor' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/user-management')}
            >
              <View style={styles.actionLeft}>
                <Ionicons name="people" size={24} color="#4CAF50" />
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>User Management</Text>
                  <Text style={styles.actionDescription}>Manage team members and access</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>
          )}

          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={24} color="#FF9800" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Logout</Text>
              <Text style={styles.actionDescription}>Switch to different user</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ App Information</Text>
          
          <TouchableOpacity style={styles.actionItem} onPress={handleAbout}>
            <Ionicons name="information-circle" size={24} color="#9C27B0" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>About This App</Text>
              <Text style={styles.actionDescription}>Version and details</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="help-circle" size={24} color="#FF9800" />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Help & Support</Text>
              <Text style={styles.actionDescription}>Get assistance</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Danger Zone</Text>
          
          <TouchableOpacity 
            style={[styles.actionItem, styles.dangerItem]}
            onPress={handleResetApp}
          >
            <Ionicons name="trash" size={24} color="#F44336" />
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, styles.dangerText]}>Reset App Data</Text>
              <Text style={styles.actionDescription}>Clear all settings and logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  section: {
    margin: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  userIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3d3d3d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    color: '#4CAF50',
    fontSize: 14,
  },
  settingItem: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    color: '#aaa',
    fontSize: 12,
  },
  actionItem: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionDescription: {
    color: '#aaa',
    fontSize: 12,
  },
  dangerItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  dangerText: {
    color: '#F44336',
  },
  bottomSpacer: {
    height: 40,
  },
});
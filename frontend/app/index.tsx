import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppErrorHandler } from '../utils/AppErrorHandler';
import { ErrorBoundary } from '../components/ErrorBoundary';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

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
  todayTransactions: number;
  healthScore: number;
}

interface PriorityItem {
  id: string;
  name: string;
  type: 'material' | 'tool';
  priority: 'urgent' | 'medium' | 'low';
  reason: string;
  icon: string;
}

interface TeamActivity {
  id: string;
  user: string;
  action: string;
  item: string;
  time: string;
  type: 'take' | 'restock' | 'checkout' | 'checkin' | 'scan';
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({ 
    materials: 0, 
    tools: 0, 
    lowStock: 0, 
    todayTransactions: 0,
    healthScore: 85
  });
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [teamActivity, setTeamActivity] = useState<TeamActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [shakeAnimation] = useState(new Animated.Value(0));

  // Default PINs for each user (in production, these would be stored securely)
  const userPins: { [key: string]: string } = {
    'lee_carter': '1234',
    'dan_carter': '1234',
    'lee_paull': '2468',
    'dean_turnill': '1357',
    'luis': '9876'
  };

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const initializeApp = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');
      
      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const users = await AppErrorHandler.safeNetworkCall(
      `${EXPO_PUBLIC_BACKEND_URL}/api/users`,
      {},
      'Fetch Users'
    );
    
    if (users) {
      setUsers(users);
    } else {
      // Fallback: show friendly message but don't crash
      Alert.alert(
        '🔧 Quick Setup',
        'Getting your team ready! This will just take a moment...',
        [{ text: 'No worries! 👍' }]
      );
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Use safe network calls with auto error handling
      const [materials, tools, lowStockData, transactions] = await Promise.all([
        AppErrorHandler.safeNetworkCall(`${EXPO_PUBLIC_BACKEND_URL}/api/materials`, {}, 'Fetch Materials'),
        AppErrorHandler.safeNetworkCall(`${EXPO_PUBLIC_BACKEND_URL}/api/tools`, {}, 'Fetch Tools'),
        AppErrorHandler.safeNetworkCall(`${EXPO_PUBLIC_BACKEND_URL}/api/alerts/low-stock`, {}, 'Fetch Low Stock'),
        AppErrorHandler.safeNetworkCall(`${EXPO_PUBLIC_BACKEND_URL}/api/transactions?limit=20`, {}, 'Fetch Transactions')
      ]);

      // Handle potential null responses gracefully
      const safeData = {
        materials: materials || [],
        tools: tools || [],
        lowStock: (lowStockData && lowStockData.count) ? lowStockData.count : 0,
        transactions: transactions || []
      };

      // Calculate today's transactions
      const today = new Date().toDateString();
      const todayTransactions = safeData.transactions.filter((t: any) => 
        new Date(t.timestamp).toDateString() === today
      ).length;

      // Calculate health score
      const totalItems = safeData.materials.length + safeData.tools.length;
      const lowStockCount = safeData.lowStock;
      const healthScore = totalItems > 0 ? Math.max(50, 100 - (lowStockCount / totalItems) * 50) : 100;

      setStats({
        materials: safeData.materials.length,
        tools: safeData.tools.length,
        lowStock: safeData.lowStock,
        todayTransactions,
        healthScore: Math.round(healthScore),
      });

      // Generate priority items for supervisors
      if (user?.role === 'supervisor') {
        generatePriorityItems(safeData.materials, safeData.tools, (lowStockData && lowStockData.materials) || []);
        generateTeamActivity(safeData.transactions);
      }
    } catch (error) {
      // This shouldn't happen with safe calls, but just in case
      console.log('📱 Dashboard data will refresh automatically when connection is restored');
    }
  };

  const generatePriorityItems = (materials: any[], tools: any[], lowStockMaterials: any[]) => {
    const priorities: PriorityItem[] = [];

    // Add urgent low stock items
    lowStockMaterials.slice(0, 2).forEach((item: any) => {
      priorities.push({
        id: item.id,
        name: item.name,
        type: 'material',
        priority: 'urgent',
        reason: `Only ${item.quantity} left (min: ${item.min_stock})`,
        icon: 'warning'
      });
    });

    // Add tools needing maintenance (mock data for demo)
    const maintenanceTools = tools.filter((tool: any) => tool.condition === 'fair' || tool.condition === 'poor');
    maintenanceTools.slice(0, 1).forEach((tool: any) => {
      priorities.push({
        id: tool.id,
        name: tool.name,
        type: 'tool',
        priority: tool.condition === 'poor' ? 'urgent' : 'medium',
        reason: `Condition: ${tool.condition}`,
        icon: 'construct'
      });
    });

    setPriorities(priorities.slice(0, 3));
  };

  const generateTeamActivity = (transactions: any[]) => {
    const activities: TeamActivity[] = transactions.slice(0, 5).map((transaction: any) => {
      const time = new Date(transaction.timestamp);
      const minutesAgo = Math.floor((Date.now() - time.getTime()) / 60000);
      
      return {
        id: transaction.id,
        user: transaction.user_name,
        action: getActionText(transaction.transaction_type),
        item: getItemName(transaction.item_id),
        time: minutesAgo < 60 ? `${minutesAgo}m ago` : `${Math.floor(minutesAgo / 60)}h ago`,
        type: transaction.transaction_type
      };
    });

    setTeamActivity(activities);
  };

  const getActionText = (type: string) => {
    switch (type) {
      case 'take': return 'took';
      case 'restock': return 'restocked';
      case 'check_out': return 'checked out';
      case 'check_in': return 'returned';
      default: return 'updated';
    }
  };

  const getItemName = (itemId: string) => {
    // In a real app, you'd look up the item name
    return 'Item'; // Simplified for demo
  };

  const handleUserSelect = (userData: User) => {
    setSelectedUser(userData);
    setShowPinModal(true);
    setPin('');
  };

  const verifyPin = async () => {
    if (!selectedUser) return;

    const correctPin = userPins[selectedUser.id];
    if (pin === correctPin) {
      await handleLogin(selectedUser.id);
      setShowPinModal(false);
      setPin('');
    } else {
      // Shake animation for wrong PIN
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
      
      Alert.alert('Wrong PIN', 'Please enter the correct PIN to continue.');
      setPin('');
    }
  };

  const handleLogin = async (userId: string) => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/auth/login?user_id=${userId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const { token, user: userData } = await response.json();
        
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
            setStats({ materials: 0, tools: 0, lowStock: 0, todayTransactions: 0, healthScore: 85 });
            setPriorities([]);
            setTeamActivity([]);
            await fetchUsers();
          },
        },
      ]
    );
  };

  const navigateToScreen = (screen: string) => {
    router.push(`/${screen}` as any);
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#F44336';
      case 'medium': return '#FF9800';
      default: return '#4CAF50';
    }
  };

  const renderPinModal = () => (
    <Modal visible={showPinModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.pinModal,
            { transform: [{ translateX: shakeAnimation }] }
          ]}
        >
          <View style={styles.pinHeader}>
            <Text style={styles.pinTitle}>Enter Your PIN</Text>
            {selectedUser && (
              <Text style={styles.pinSubtitle}>
                Welcome back, {selectedUser.name.split(' ')[0]}! 👋
              </Text>
            )}
          </View>

          <View style={styles.pinInputContainer}>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              placeholder="••••"
              placeholderTextColor="#666"
              autoFocus
            />
          </View>

          <View style={styles.pinButtons}>
            <TouchableOpacity
              style={[styles.pinButton, styles.cancelButton]}
              onPress={() => {
                setShowPinModal(false);
                setPin('');
              }}
            >
              <Text style={styles.pinButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.pinButton, styles.confirmButton]}
              onPress={verifyPin}
              disabled={pin.length !== 4}
            >
              <Text style={styles.pinButtonText}>Login</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.pinHint}>
            💡 Default PINs: Supervisors (1234), Engineers (check with supervisor)
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );

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

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="cube" size={48} color="#4CAF50" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Asset Inventory</Text>
              <Text style={styles.headerSubtitle}>Chimes Shopping Centre ✨</Text>
            </View>
          </View>
        </View>

        <View style={styles.loginSection}>
          <Text style={styles.loginTitle}>Welcome to Your Digital Toolkit! 🛠️</Text>
          <Text style={styles.loginSubtext}>Tap your name to get started</Text>
          
          {users.map((userData) => (
            <TouchableOpacity
              key={userData.id}
              style={[
                styles.userButton,
                userData.role === 'supervisor' ? styles.supervisorButton : styles.engineerButton
              ]}
              onPress={() => handleUserSelect(userData)}
            >
              <View style={styles.userButtonContent}>
                <View style={styles.userIconContainer}>
                  <Ionicons
                    name={userData.role === 'supervisor' ? 'star' : 'person'}
                    size={24}
                    color="#fff"
                  />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userData.name}</Text>
                  <Text style={styles.userRole}>
                    {userData.role === 'supervisor' ? '⭐ Supervisor' : '🔧 Engineer'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {renderPinModal()}
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
            <Text style={styles.welcomeText}>
              Hey {user.name.split(' ')[0]}! 👋 Ready to rock?
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Supervisor Dashboard */}
        {user.role === 'supervisor' && (
          <View style={styles.supervisorDashboard}>
            {/* Health Score */}
            <View style={styles.healthScoreCard}>
              <View style={styles.healthScoreContent}>
                <View style={styles.healthScoreLeft}>
                  <Text style={styles.healthScoreTitle}>Inventory Health</Text>
                  <Text style={[
                    styles.healthScoreValue,
                    { color: getHealthScoreColor(stats.healthScore) }
                  ]}>
                    {stats.healthScore}%
                  </Text>
                </View>
                <View style={[
                  styles.healthScoreIndicator,
                  { backgroundColor: getHealthScoreColor(stats.healthScore) }
                ]}>
                  <Ionicons 
                    name={stats.healthScore >= 80 ? 'checkmark' : stats.healthScore >= 60 ? 'warning' : 'alert'} 
                    size={24} 
                    color="#fff" 
                  />
                </View>
              </View>
            </View>

            {/* Today's Priorities */}
            {priorities.length > 0 && (
              <View style={styles.prioritiesCard}>
                <Text style={styles.prioritiesTitle}>🎯 Today's Priorities</Text>
                {priorities.slice(0, 2).map((priority, index) => (
                  <View key={priority.id} style={styles.priorityItem}>
                    <View style={[
                      styles.priorityIndicator,
                      { backgroundColor: getPriorityColor(priority.priority) }
                    ]}>
                      <Ionicons name={priority.icon as any} size={14} color="#fff" />
                    </View>
                    <View style={styles.priorityInfo}>
                      <Text style={styles.priorityName}>{priority.name}</Text>
                      <Text style={styles.priorityReason}>{priority.reason}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Team Activity - Compact */}
            {teamActivity.length > 0 && (
              <View style={styles.teamActivityCard}>
                <Text style={styles.teamActivityTitle}>👥 Team Activity</Text>
                {teamActivity.slice(0, 2).map((activity) => (
                  <View key={activity.id} style={styles.activityItem}>
                    <Text style={styles.activityText}>
                      <Text style={styles.activityUser}>{activity.user.split(' ')[0]}</Text>
                      {' '}
                      <Text style={styles.activityAction}>{activity.action}</Text>
                      {' '}
                      <Text style={styles.activityItemText}>{activity.item}</Text>
                    </Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Main Action Buttons */}
        <View style={styles.mainActions}>
          {user.role === 'supervisor' && (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => navigateToScreen('dashboard')}
              >
                <Ionicons name="analytics" size={28} color="#fff" />
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonText}>Smart Dashboard</Text>
                  <Text style={styles.actionButtonSubtext}>📊 Reports & Analytics</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.addButton]}
                onPress={() => navigateToScreen('add-item')}
              >
                <Ionicons name="add-circle" size={28} color="#fff" />
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonText}>Add New Item</Text>
                  <Text style={styles.actionButtonSubtext}>➕ Materials & Tools</Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity 
            style={[styles.actionButton, styles.scanButton]}
            onPress={() => navigateToScreen('scanner')}
          >
            <Ionicons name="qr-code" size={28} color="#fff" />
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonText}>Quick Scan</Text>
              <Text style={styles.actionButtonSubtext}>📱 Instant Item Access</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.inventoryButton]}
            onPress={() => navigateToScreen('inventory')}
          >
            <Ionicons name="grid" size={28} color="#fff" />
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonText}>Browse Inventory</Text>
              <Text style={styles.actionButtonSubtext}>📦 Search & Find</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.stockTakeButton]}
            onPress={() => navigateToScreen('stock-take')}
          >
            <Ionicons name="clipboard" size={28} color="#fff" />
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonText}>Stock Count</Text>
              <Text style={styles.actionButtonSubtext}>📋 Easy Counting</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.deliveryButton]}
            onPress={() => navigateToScreen('deliveries')}
          >
            <Ionicons name="cube" size={28} color="#fff" />
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonText}>Log Delivery</Text>
              <Text style={styles.actionButtonSubtext}>📦 Receive Items</Text>
            </View>
          </TouchableOpacity>

          {user.role === 'supervisor' && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.settingsButton]}
              onPress={() => navigateToScreen('settings')}
            >
              <Ionicons name="settings" size={28} color="#fff" />
              <View style={styles.actionButtonContent}>
                <Text style={styles.actionButtonText}>Settings</Text>
                <Text style={styles.actionButtonSubtext}>⚙️ Customize App</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Enhanced Quick Stats */}
        <View style={styles.quickStats}>
          <Text style={styles.quickStatsTitle}>📊 Quick Overview</Text>
          <View style={styles.statsRow}>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => navigateToScreen('inventory')}
            >
              <Ionicons name="cube" size={20} color="#4CAF50" />
              <Text style={styles.statNumber}>{stats.materials}</Text>
              <Text style={styles.statLabel}>Materials</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => navigateToScreen('inventory')}
            >
              <Ionicons name="build" size={20} color="#2196F3" />
              <Text style={styles.statNumber}>{stats.tools}</Text>
              <Text style={styles.statLabel}>Tools</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.statCard, stats.lowStock > 0 && styles.alertStatCard]}
              onPress={() => user.role === 'supervisor' && navigateToScreen('dashboard')}
            >
              <Ionicons 
                name="warning" 
                size={20} 
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

            <TouchableOpacity style={styles.statCard}>
              <Ionicons name="today" size={20} color="#9C27B0" />
              <Text style={styles.statNumber}>{stats.todayTransactions}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    gap: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
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
    marginBottom: 8,
  },
  loginSubtext: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  userButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  userIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinModal: {
    backgroundColor: '#2d2d2d',
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    maxWidth: 320,
  },
  pinHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pinTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pinSubtitle: {
    color: '#4CAF50',
    fontSize: 16,
  },
  pinInputContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  pinInput: {
    backgroundColor: '#3d3d3d',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 24,
    textAlign: 'center',
    width: 120,
    letterSpacing: 8,
  },
  pinButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pinButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  pinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pinHint: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  supervisorDashboard: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 10,
  },
  healthScoreCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
  },
  healthScoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthScoreLeft: {
    flex: 1,
  },
  healthScoreTitle: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  healthScoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  healthScoreIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prioritiesCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
  },
  prioritiesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  priorityIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityInfo: {
    flex: 1,
  },
  priorityName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  priorityReason: {
    color: '#aaa',
    fontSize: 12,
  },
  teamActivityCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
  },
  teamActivityTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityText: {
    flex: 1,
    color: '#aaa',
    fontSize: 13,
  },
  activityUser: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  activityAction: {
    color: '#fff',
  },
  activityItemText: {
    color: '#fff',
  },
  activityTime: {
    color: '#666',
    fontSize: 12,
  },
  mainActions: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 16,
    minHeight: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  actionButtonContent: {
    flex: 1,
    justifyContent: 'center',
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
  deliveryButton: {
    backgroundColor: '#9C27B0',
  },
  settingsButton: {
    backgroundColor: '#607D8B',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  actionButtonSubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
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
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#3d3d3d',
    flex: 1,
    marginHorizontal: 2,
  },
  alertStatCard: {
    backgroundColor: '#4d3d2d',
  },
  statNumber: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  alertStatNumber: {
    color: '#FF9800',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 11,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  activityItemText: {
    color: '#fff',
  },
});
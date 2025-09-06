import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
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

interface LowStockAlert {
  id: string;
  name: string;
  quantity: number;
  min_stock: number;
  unit: string;
  supplier?: {
    name: string;
    phone?: string;
  };
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [lowStockItems, setLowStockItems] = useState<LowStockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

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

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/alerts/low-stock`);
      if (response.ok) {
        const data = await response.json();
        setLowStockItems(data.materials || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (!user || user.role !== 'supervisor') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="lock-closed" size={48} color="#F44336" />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            This dashboard is only available to supervisors
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supervisor Dashboard</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4CAF50"
          />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome back, {user.name.split(' ')[0]}! 👋
          </Text>
          <Text style={styles.welcomeSubtext}>
            Here's your inventory oversight dashboard
          </Text>
        </View>

        {/* Low Stock Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning" size={24} color="#FF9800" />
            <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading alerts...</Text>
            </View>
          ) : lowStockItems.length === 0 ? (
            <View style={styles.noAlertsCard}>
              <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
              <Text style={styles.noAlertsTitle}>All Good! ✅</Text>
              <Text style={styles.noAlertsText}>
                No low stock alerts at the moment
              </Text>
            </View>
          ) : (
            lowStockItems.map((item) => (
              <View key={item.id} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <Ionicons name="cube" size={20} color="#FF9800" />
                  <Text style={styles.alertItemName}>{item.name}</Text>
                  <View style={styles.urgencyBadge}>
                    <Text style={styles.urgencyText}>URGENT</Text>
                  </View>
                </View>
                
                <View style={styles.alertDetails}>
                  <Text style={styles.alertStock}>
                    Current: {item.quantity} {item.unit}
                  </Text>
                  <Text style={styles.alertMinStock}>
                    Minimum: {item.min_stock} {item.unit}
                  </Text>
                </View>

                {item.supplier && (
                  <View style={styles.supplierInfo}>
                    <Text style={styles.supplierLabel}>Quick Reorder:</Text>
                    <Text style={styles.supplierName}>{item.supplier.name}</Text>
                    {item.supplier.phone && (
                      <TouchableOpacity style={styles.callButton}>
                        <Ionicons name="call" size={16} color="#4CAF50" />
                        <Text style={styles.callButtonText}>{item.supplier.phone}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.reorderButton}
                  onPress={() => {
                    // Navigate to add stock or reorder
                    router.push('/inventory');
                  }}
                >
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.reorderButtonText}>Quick Restock</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={24} color="#4CAF50" />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/inventory')}
            >
              <Ionicons name="list" size={28} color="#2196F3" />
              <Text style={styles.quickActionText}>View All Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/stock-take')}
            >
              <Ionicons name="clipboard" size={28} color="#795548" />
              <Text style={styles.quickActionText}>Start Stock Take</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/add-item')}
            >
              <Ionicons name="add-circle" size={28} color="#4CAF50" />
              <Text style={styles.quickActionText}>Add New Items</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => router.push('/scanner')}
            >
              <Ionicons name="qr-code" size={28} color="#9C27B0" />
              <Text style={styles.quickActionText}>QR Scanner</Text>
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
  welcomeSection: {
    padding: 20,
    backgroundColor: '#2d2d2d',
    margin: 20,
    borderRadius: 12,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtext: {
    color: '#aaa',
    fontSize: 14,
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingCard: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
  },
  noAlertsCard: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  noAlertsTitle: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noAlertsText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
  },
  alertCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  alertItemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  urgencyBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  alertStock: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  alertMinStock: {
    color: '#aaa',
    fontSize: 14,
  },
  supplierInfo: {
    backgroundColor: '#3d3d3d',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  supplierLabel: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  supplierName: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  callButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  reorderButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    gap: 8,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
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

export default function MaintenanceHub() {
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

  const handleComingSoon = (feature: string) => {
    // For now, just show which feature was tapped
    console.log(`${feature} feature coming soon!`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <UniversalHeader title="Maintenance Hub" showBackButton={true} />
        <View style={styles.centerContent}>
          <Ionicons name="construct" size={48} color="#2196F3" />
          <Text style={styles.loadingText}>Loading maintenance tools...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <UniversalHeader title="Maintenance Hub" showBackButton={true} />
      
      <ScrollView style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeHeader}>
            <Ionicons name="construct" size={32} color="#2196F3" />
            <Text style={styles.welcomeTitle}>Maintenance Operations</Text>
          </View>
          <Text style={styles.welcomeSubtext}>
            Welcome {user?.name.split(' ')[0]}! Your maintenance management tools will be available here.
          </Text>
        </View>

        {/* Coming Soon Badge */}
        <View style={styles.comingSoonBanner}>
          <Ionicons name="time" size={24} color="#FF9800" />
          <Text style={styles.comingSoonTitle}>🚧 Under Development</Text>
          <Text style={styles.comingSoonText}>
            Advanced maintenance features are being built and will be available soon!
          </Text>
        </View>

        {/* Maintenance Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>🔧 Maintenance Categories</Text>
          
          {/* PPMs */}
          <TouchableOpacity 
            style={styles.categoryCard}
            onPress={() => router.push('/ppms')}
          >
            <View style={[styles.categoryIcon, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="calendar" size={28} color="#fff" />
            </View>
            <View style={styles.categoryContent}>
              <Text style={styles.categoryTitle}>PPMs</Text>
              <Text style={styles.categorySubtitle}>Planned Preventive Maintenance</Text>
              <Text style={styles.categoryDescription}>
                Schedule and track routine maintenance tasks, inspections, and preventive work orders.
              </Text>
            </View>
            <View style={styles.categoryStatus}>
              <Text style={styles.activeLabel}>ACTIVE</Text>
              <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
            </View>
          </TouchableOpacity>

          {/* Call Outs */}
          <TouchableOpacity 
            style={styles.categoryCard}
            onPress={() => handleComingSoon('Call Outs')}
          >
            <View style={[styles.categoryIcon, { backgroundColor: '#F44336' }]}>
              <Ionicons name="call" size={28} color="#fff" />
            </View>
            <View style={styles.categoryContent}>
              <Text style={styles.categoryTitle}>Call Outs</Text>
              <Text style={styles.categorySubtitle}>Emergency Response</Text>
              <Text style={styles.categoryDescription}>
                Handle urgent maintenance requests, emergency repairs, and immediate response calls.
              </Text>
            </View>
            <View style={styles.categoryStatus}>
              <Text style={styles.comingSoonLabel}>COMING SOON</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          {/* Reactive Jobs */}
          <TouchableOpacity 
            style={styles.categoryCard}
            onPress={() => handleComingSoon('Reactive Jobs')}
          >
            <View style={[styles.categoryIcon, { backgroundColor: '#FF9800' }]}>
              <Ionicons name="flash" size={28} color="#fff" />
            </View>
            <View style={styles.categoryContent}>
              <Text style={styles.categoryTitle}>Reactive Jobs</Text>
              <Text style={styles.categorySubtitle}>Repair & Fix Issues</Text>
              <Text style={styles.categoryDescription}>
                Manage breakdown repairs, troubleshooting tasks, and reactive maintenance work.
              </Text>
            </View>
            <View style={styles.categoryStatus}>
              <Text style={styles.comingSoonLabel}>COMING SOON</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          {/* Work Orders */}
          <TouchableOpacity 
            style={styles.categoryCard}
            onPress={() => handleComingSoon('Work Orders')}
          >
            <View style={[styles.categoryIcon, { backgroundColor: '#9C27B0' }]}>
              <Ionicons name="clipboard" size={28} color="#fff" />
            </View>
            <View style={styles.categoryContent}>
              <Text style={styles.categoryTitle}>Work Orders</Text>
              <Text style={styles.categorySubtitle}>Job Management System</Text>
              <Text style={styles.categoryDescription}>
                Create, assign, and track work orders with full job lifecycle management.
              </Text>
            </View>
            <View style={styles.categoryStatus}>
              <Text style={styles.comingSoonLabel}>COMING SOON</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Future Features Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>🔮 What's Coming</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Digital work order creation and assignment</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Maintenance scheduling and reminders</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Photo documentation and progress tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Parts ordering and inventory integration</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Maintenance history and reporting</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: '#4CAF50' }]}
              onPress={() => router.push('/inventory')}
            >
              <Ionicons name="cube" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Check Materials</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: '#2196F3' }]}
              onPress={() => router.push('/scanner')}
            >
              <Ionicons name="qr-code" size={24} color="#fff" />
              <Text style={styles.quickActionText}>QR Scanner</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: '#9C27B0' }]}
              onPress={() => router.push('/help')}
            >
              <Ionicons name="help-circle" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Get Help</Text>
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
  content: {
    flex: 1,
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
  welcomeSection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  welcomeSubtext: {
    color: '#aaa',
    fontSize: 16,
    lineHeight: 22,
  },
  comingSoonBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9800',
    alignItems: 'center',
  },
  comingSoonTitle: {
    color: '#FF9800',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  comingSoonText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  categoriesSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  categorySubtitle: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  categoryDescription: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 18,
  },
  categoryStatus: {
    alignItems: 'center',
    marginLeft: 12,
  },
  comingSoonLabel: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activeLabel: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  previewSection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
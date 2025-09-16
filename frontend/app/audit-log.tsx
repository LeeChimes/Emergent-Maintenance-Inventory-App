import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  
  
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Screen from './components/Screen';
import Container from './components/Container';
import UniversalHeader from '../components/UniversalHeader';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

interface AuditLogEntry {
  id: string;
  user_name: string;
  action: string;
  item_id: string;
  item_name: string;
  timestamp: string;
  transaction_type: 'take' | 'restock' | 'check_out' | 'check_in' | 'scan' | 'add' | 'update' | 'delete';
  details?: any;
}

export default function AuditLog() {
  const [user, setUser] = useState<User | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAuditLog();
    }
  }, [user]);

  const initializeUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Check if user is supervisor
        if (parsedUser.role !== 'supervisor') {
          router.replace('/');
        }
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/');
    }
  };

  const fetchAuditLog = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/transactions?limit=100&sort=desc`);
      if (response.ok) {
        const data = await response.json();
        setAuditEntries(data || []);
      }
    } catch (error) {
      console.error('Error fetching audit log:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAuditLog();
  };

  const getActionIcon = (transactionType: string) => {
    switch (transactionType) {
      case 'take': return 'arrow-down';
      case 'restock': return 'arrow-up';
      case 'check_out': return 'exit-outline';
      case 'check_in': return 'enter-outline';
      case 'scan': return 'qr-code-outline';
      case 'add': return 'add-circle-outline';
      case 'update': return 'create-outline';
      case 'delete': return 'trash-outline';
      default: return 'document-outline';
    }
  };

  const getActionColor = (transactionType: string) => {
    switch (transactionType) {
      case 'take': return '#F44336';
      case 'restock': return '#4CAF50';
      case 'check_out': return '#FF9800';
      case 'check_in': return '#2196F3';
      case 'scan': return '#9C27B0';
      case 'add': return '#4CAF50';
      case 'update': return '#FF9800';
      case 'delete': return '#F44336';
      default: return '#666';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getActionText = (transactionType: string) => {
    switch (transactionType) {
      case 'take': return 'took';
      case 'restock': return 'restocked';
      case 'check_out': return 'checked out';
      case 'check_in': return 'returned';
      case 'scan': return 'scanned';
      case 'add': return 'added';
      case 'update': return 'updated';
      case 'delete': return 'deleted';
      default: return 'modified';
    }
  };

  if (!user || user.role !== 'supervisor') {
    return (
      <Screen scroll>
      <Container>
        <View style={styles.centerContent}>
          <Ionicons name="lock-closed" size={48} color="#F44336" />
          <Text style={styles.accessDeniedText}>Access Denied</Text>
          <Text style={styles.accessDeniedSubtext}>
            This audit log is only available to supervisors
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </Container>
    </Screen>
    );
  }

  return (
    <Screen scroll>
      <Container>
      <UniversalHeader title="Audit Log" showBackButton={true} />

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
        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
            <Text style={styles.infoTitle}>Team Activity Archive</Text>
          </View>
          <Text style={styles.infoText}>
            Complete audit trail of all team activities including material takes, restocks, tool checkouts, and system updates.
          </Text>
        </View>

        {/* Audit Entries */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading audit log...</Text>
          </View>
        ) : auditEntries.length === 0 ? (
          <View style={styles.noEntriesContainer}>
            <Ionicons name="document-outline" size={48} color="#666" />
            <Text style={styles.noEntriesTitle}>No Activity Yet</Text>
            <Text style={styles.noEntriesText}>
              Team activities will appear here once they start using the system.
            </Text>
          </View>
        ) : (
          <View style={styles.entriesContainer}>
            <Text style={styles.entriesTitle}>
              📋 Recent Activity ({auditEntries.length} entries)
            </Text>
            
            {auditEntries.map((entry, index) => (
              <View key={entry.id || index} style={styles.auditEntry}>
                <View style={styles.entryHeader}>
                  <View style={[
                    styles.actionIcon,
                    { backgroundColor: getActionColor(entry.transaction_type) }
                  ]}>
                    <Ionicons
                      name={getActionIcon(entry.transaction_type) as any}
                      size={16}
                      color="#fff"
                    />
                  </View>
                  
                  <View style={styles.entryDetails}>
                    <Text style={styles.entryUser}>{entry.user_name}</Text>
                    <Text style={styles.entryAction}>
                      {getActionText(entry.transaction_type)} {entry.item_name || 'an item'}
                    </Text>
                  </View>
                  
                  <Text style={styles.entryTime}>
                    {formatTimestamp(entry.timestamp)}
                  </Text>
                </View>
                
                {entry.details && (
                  <View style={styles.entryDetailsSection}>
                    <Text style={styles.entryDetailsText}>
                      {JSON.stringify(entry.details, null, 2)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
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
  infoSection: {
    margin: 20,
    padding: 16,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoText: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 16,
  },
  noEntriesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noEntriesTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  noEntriesText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  entriesContainer: {
    margin: 20,
    marginTop: 0,
  },
  entriesTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  auditEntry: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryDetails: {
    flex: 1,
  },
  entryUser: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  entryAction: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
  entryTime: {
    color: '#666',
    fontSize: 12,
  },
  entryDetailsSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#3d3d3d',
    borderRadius: 8,
  },
  entryDetailsText: {
    color: '#aaa',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
// frontend/app/deliveries.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from './components/Screen';
import Container from './components/Container';
import UniversalHeader from '../components/UniversalHeader';
import { AppErrorHandler } from '../utils/AppErrorHandler';

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

type DeliveryStatus = 'Pending' | 'Received' | 'Issue';

interface Delivery {
  id: string;            // e.g., 'DEL-001'
  supplier: string;      // e.g., 'Screwfix'
  reference: string;     // e.g., PO or courier ref
  date: string;          // ISO date
  location: string;      // where to bring it
  status: DeliveryStatus;
  notes?: string;
}

export default function Deliveries() {
  // read params from scanner redirect
  const params = useLocalSearchParams<{ scanned?: string; t?: string; id?: string }>();
  const [scanId, setScanId] = useState<string>('');

  const [user, setUser] = useState<User | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // apply scanned delivery id
  useEffect(() => {
    if (params.scanned === '1' && params.t === 'delivery' && params.id) {
      setScanId(String(params.id));
      // If you prefer to auto-open a detail view, do it here instead:
      // openDeliveryDetail(String(params.id));
    }
  }, [params.scanned, params.t, params.id]);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) fetchDeliveries();
  }, [user]);

  const initializeUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) return router.replace('/');
      const parsed = JSON.parse(userData);
      setUser(parsed);
    } catch (e) {
      console.error('Error loading user', e);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    try {
      // Mock data until backend endpoints are wired
      const mock: Delivery[] = [
        {
          id: 'DEL-001',
          supplier: 'Screwfix',
          reference: 'SF-PO-92311',
          date: '2025-01-16',
          location: 'Goods In',
          status: 'Pending',
          notes: 'Boxes 1/3 arrived earlier',
        },
        {
          id: 'DEL-002',
          supplier: 'Toolstation',
          reference: 'TS-INV-4419',
          date: '2025-01-15',
          location: 'Workshop',
          status: 'Received',
        },
        {
          id: 'DEL-003',
          supplier: 'DHL',
          reference: 'DHL-TRACK-884211',
          date: '2025-01-14',
          location: 'Security',
          status: 'Issue',
          notes: 'Damaged packaging on arrival',
        },
      ];
      setDeliveries(mock);
    } catch (err) {
      console.error('Error fetching deliveries', err);
      AppErrorHandler.handleError(err as Error, 'Failed to load deliveries');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveries();
    setRefreshing(false);
  };

  const getStatusColor = (s: DeliveryStatus) => {
    switch (s) {
      case 'Pending':
        return '#FF9800';
      case 'Received':
        return '#4CAF50';
      case 'Issue':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const filtered = deliveries.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      d.id.toLowerCase().includes(q) ||
      d.supplier.toLowerCase().includes(q) ||
      d.reference.toLowerCase().includes(q) ||
      d.location.toLowerCase().includes(q) ||
      (d.notes?.toLowerCase().includes(q) ?? false);
    const matchesScan =
      !scanId ||
      d.id.includes(scanId) ||
      d.reference.includes(scanId) ||
      d.supplier.toLowerCase().includes(scanId.toLowerCase());
    return matchesSearch && matchesScan;
  });

  const markReceived = (delivery: Delivery) => {
    Alert.alert(
      'Mark as received',
      `Confirm ${delivery.id} from ${delivery.supplier} is received?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: () => {
            setDeliveries((prev) =>
              prev.map((d) => (d.id === delivery.id ? { ...d, status: 'Received' } : d))
            );
            Alert.alert('Updated', `${delivery.id} marked as received.`);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Screen scroll>
        <Container>
          <UniversalHeader title="Deliveries" showBackButton={true} />
          <View style={styles.centerContent}>
            <Ionicons name="cube" size={48} color="#4CAF50" />
            <Text style={styles.loadingText}>Loading deliveries…</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Container>
        <UniversalHeader title="Deliveries" showBackButton={true} />

        {/* Search */}
        <View style={styles.searchSection}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search deliveries (ID, supplier, ref, location)…"
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* List */}
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filtered.map((d) => (
            <View
              key={d.id}
              style={[
                styles.card,
                scanId &&
                (d.id === scanId ||
                  d.reference.includes(scanId) ||
                  d.supplier.toLowerCase().includes(scanId.toLowerCase()))
                  ? { borderWidth: 2, borderColor: '#4CAF50' }
                  : null,
              ]}
            >
              <View style={styles.headerRow}>
                <Text style={styles.idText}>{d.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(d.status) }]}>
                  <Text style={styles.statusTxt}>{d.status}</Text>
                </View>
              </View>

              <Text style={styles.supplier}>{d.supplier}</Text>
              <Text style={styles.lightText}>Ref: {d.reference}</Text>
              <Text style={styles.lightText}>Date: {d.date}</Text>
              <Text style={styles.lightText}>Location: {d.location}</Text>
              {d.notes ? <Text style={styles.notes}>Notes: {d.notes}</Text> : null}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => Alert.alert('View Delivery', `Viewing ${d.id}`)}
                >
                  <Ionicons name="eye" size={18} color="#2196F3" />
                  <Text style={[styles.actionTxt, { color: '#2196F3' }]}>View</Text>
                </TouchableOpacity>

                {d.status !== 'Received' && (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => markReceived(d)}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={[styles.actionTxt, { color: '#4CAF50' }]}>Received</Text>
                  </TouchableOpacity>
                )}

                {user?.role === 'supervisor' && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => Alert.alert('Edit', 'Edit flow not implemented yet')}
                  >
                    <Ionicons name="create" size={18} color="#FF9800" />
                    <Text style={[styles.actionTxt, { color: '#FF9800' }]}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color="#666" />
              <Text style={styles.emptyTitle}>No Deliveries Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try adjusting your search' : 'No delivery records available.'}
              </Text>
            </View>
          )}
        </ScrollView>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    paddingHorizontal: 16,
    margin: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  idText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusTxt: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  supplier: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  lightText: {
    color: '#bbb',
    fontSize: 14,
    marginBottom: 2,
  },
  notes: {
    color: '#ddd',
    fontSize: 13,
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#404040',
    paddingTop: 12,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  actionTxt: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

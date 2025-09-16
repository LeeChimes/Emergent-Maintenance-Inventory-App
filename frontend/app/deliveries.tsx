// frontend/app/deliveries.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, router } from 'expo-router';
import Screen from './components/Screen';
import Container from './components/Container';
import UniversalHeader from './components/UniversalHeader';
import QRBadge from './components/QRBadge';

type Role = 'supervisor' | 'engineer';

interface User {
  id: string;
  name: string;
  role: Role;
}

interface Delivery {
  id: string;            // e.g., "DEL-001"
  supplier: string;      // e.g., "Kone Ltd"
  description: string;   // e.g., "Escalator chain"
  status: 'Pending' | 'Received';
  eta?: string;          // ISO date or short date string
  created_at: string;
}

export default function Deliveries() {
  // support deep link: /deliveries?scanned=1&id=DEL-001
  const params = useLocalSearchParams<{ scanned?: string; id?: string }>();
  const [highlightId, setHighlightId] = useState<string>('');

  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (params.scanned === '1' && params.id) {
      setHighlightId(String(params.id));
    }
  }, [params.scanned, params.id]);

  useEffect(() => {
    (async () => {
      try {
        const ud = await AsyncStorage.getItem('userData');
        if (!ud) return router.replace('/');
        setUser(JSON.parse(ud));
      } catch (e) {
        console.error('Error loading user', e);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchDeliveries();
  }, [user]);

  const fetchDeliveries = async () => {
    // mock data for now
    const mock: Delivery[] = [
      {
        id: 'DEL-001',
        supplier: 'Kone Ltd',
        description: 'Escalator chain',
        status: 'Pending',
        eta: '2025-01-20',
        created_at: '2025-01-16T09:00:00Z',
      },
      {
        id: 'DEL-002',
        supplier: 'Ironmongery Direct',
        description: 'Fire door closers x4',
        status: 'Received',
        created_at: '2025-01-14T15:25:00Z',
      },
      {
        id: 'DEL-003',
        supplier: 'City Electricals',
        description: 'LED tubes 10x',
        status: 'Pending',
        eta: '2025-01-22',
        created_at: '2025-01-16T12:45:00Z',
      },
    ];
    setItems(mock);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeliveries();
    setRefreshing(false);
  };

  const colorForStatus = (s: Delivery['status']) =>
    s === 'Received' ? '#4CAF50' : '#FF9800';

  const markReceived = (id: string) => {
    if (user?.role !== 'supervisor') {
      Alert.alert('Access denied', 'Only supervisors can mark deliveries as received.');
      return;
    }
    setItems(prev =>
      prev.map(d => (d.id === id ? { ...d, status: 'Received', eta: undefined } : d)),
    );
    Alert.alert('Updated', `${id} marked as received.`);
  };

  if (loading) {
    return (
      <Screen>
        <Container>
          <UniversalHeader title="Deliveries" showBackButton />
          <View style={styles.center}>
            <Ionicons name="cube" size={48} color="#4CAF50" />
            <Text style={styles.dim}>Loading deliveries…</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Container>
        <UniversalHeader title="Deliveries" showBackButton />

        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {items.map(d => (
            <View
              key={d.id}
              style={[
                styles.card,
                highlightId && d.id === highlightId ? { borderWidth: 2, borderColor: '#4CAF50' } : null,
              ]}
            >
              <View style={styles.rowTop}>
                <QRBadge title="Delivery" value={d.id} />
                <View style={[styles.badge, { backgroundColor: colorForStatus(d.status) }]}>
                  <Text style={styles.badgeTxt}>{d.status}</Text>
                </View>
              </View>

              <Text style={styles.title}>{d.description}</Text>
              <Text style={styles.sub}>Supplier: {d.supplier}</Text>
              {d.eta ? <Text style={styles.sub}>ETA: {d.eta}</Text> : null}

              <View style={styles.rowActions}>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => Alert.alert('Delivery', `Viewing ${d.id}`)}
                >
                  <Ionicons name="eye" size={18} color="#2196F3" />
                  <Text style={[styles.actionTxt, { color: '#2196F3' }]}>View</Text>
                </TouchableOpacity>

                {d.status !== 'Received' && (
                  <TouchableOpacity style={styles.rcvBtn} onPress={() => markReceived(d.id)}>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={[styles.actionTxt, { color: '#fff' }]}>Mark Received</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {items.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={64} color="#666" />
              <Text style={styles.dim}>No deliveries</Text>
            </View>
          )}
        </ScrollView>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 20 },
  dim: { color: '#aaa' },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  card: { backgroundColor: '#2d2d2d', borderRadius: 12, padding: 16, marginBottom: 12 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  title: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  sub: { color: '#bbb', fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  badgeTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#404040',
    paddingTop: 10,
    marginTop: 10,
  },
  viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rcvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionTxt: { fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
});

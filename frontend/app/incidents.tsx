// frontend/app/incidents.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, router } from 'expo-router';
import Screen from './components/Screen';
import Container from './components/Container';
import UniversalHeader from './components/UniversalHeader';

type Role = 'supervisor' | 'engineer';

interface User {
  id: string;
  name: string;
  role: Role;
}

interface Incident {
  id: string;
  title: string;
  location: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  created_at: string;
  created_by: string;
}

export default function Incidents() {
  // support scanner redirect: /incidents?scanned=1&t=incident&id=INC-123
  const params = useLocalSearchParams<{ scanned?: string; t?: string; id?: string }>();
  const [highlightId, setHighlightId] = useState<string>('');

  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

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
    fetchIncidents();
  }, [user]);

  const fetchIncidents = async () => {
    // mock data for now
    const mock: Incident[] = [
      {
        id: 'INC-001',
        title: 'Water leak by Core 8',
        location: 'Core 8, Level 1',
        description: 'Small leak detected near service corridor',
        status: 'Open',
        priority: 'High',
        created_at: '2025-01-16T08:15:00Z',
        created_by: 'Dean Turnill',
      },
      {
        id: 'INC-002',
        title: 'Escalator alarm',
        location: 'Level 2 escalator',
        description: 'Periodic beeping reported by tenant',
        status: 'In Progress',
        priority: 'Medium',
        created_at: '2025-01-15T14:10:00Z',
        created_by: 'Luis',
      },
      {
        id: 'INC-003',
        title: 'Emergency light not working',
        location: 'Service corridor near loading bay',
        description: 'Single emergency light fails periodic test',
        status: 'Closed',
        priority: 'Low',
        created_at: '2025-01-12T10:00:00Z',
        created_by: 'Lee Carter',
      },
    ];
    setIncidents(mock);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIncidents();
    setRefreshing(false);
  };

  const filtered = incidents.filter((i) => {
    const q = search.toLowerCase();
    return (
      i.id.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <Screen>
        <Container>
          <UniversalHeader title="Incidents" showBackButton />
          <View style={styles.center}>
            <Ionicons name="alert-circle" size={48} color="#FF9800" />
            <Text style={styles.dim}>Loading incidents…</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Container>
        <UniversalHeader title="Incidents" showBackButton />

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Search incidents…"
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* List */}
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filtered.map((i) => (
            <View
              key={i.id}
              style={[
                styles.card,
                highlightId && (i.id === highlightId || i.title.includes(highlightId))
                  ? { borderWidth: 2, borderColor: '#4CAF50' }
                  : null,
              ]}
            >
              <View style={styles.header}>
                <Text style={styles.title}>{i.title}</Text>
                <View style={[styles.status, { backgroundColor: colorForStatus(i.status) }]}>
                  <Text style={styles.statusTxt}>{i.status}</Text>
                </View>
              </View>
              <Text style={styles.sub}>ID: {i.id}</Text>
              <Text style={styles.sub}>Location: {i.location}</Text>
              <Text style={styles.body}>{i.description}</Text>
              <View style={styles.footer}>
                <View style={[styles.pill, { borderColor: colorForPriority(i.priority) }]}>
                  <Text style={[styles.pillTxt, { color: colorForPriority(i.priority) }]}>
                    {i.priority}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => Alert.alert('Incident', `Viewing ${i.id}`)}>
                  <Ionicons name="eye" size={18} color="#2196F3" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={64} color="#666" />
              <Text style={styles.emptyTxt}>No incidents found</Text>
            </View>
          )}
        </ScrollView>
      </Container>
    </Screen>
  );
}

function colorForStatus(s: Incident['status']) {
  switch (s) {
    case 'Open':
      return '#F44336';
    case 'In Progress':
      return '#FF9800';
    case 'Closed':
      return '#4CAF50';
    default:
      return '#666';
  }
}

function colorForPriority(p: Incident['priority']) {
  switch (p) {
    case 'High':
      return '#F44336';
    case 'Medium':
      return '#FF9800';
    case 'Low':
      return '#4CAF50';
    default:
      return '#666';
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  dim: { color: '#aaa' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    margin: 20,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: { flex: 1, color: '#fff', paddingVertical: 10, fontSize: 16 },
  content: { paddingHorizontal: 20 },
  card: { backgroundColor: '#2d2d2d', borderRadius: 12, padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sub: { color: '#aaa', marginTop: 4 },
  body: { color: '#bbb', marginTop: 8, lineHeight: 20 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#404040',
    marginTop: 12,
    paddingTop: 10,
  },
  status: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  pill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  pillTxt: { fontSize: 12, fontWeight: 'bold' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTxt: { color: '#aaa' },
});

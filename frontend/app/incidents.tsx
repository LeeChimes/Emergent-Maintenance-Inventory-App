// frontend/app/incidents.tsx
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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from './components/Screen';
import Container from './components/Container';
import UniversalHeader from './components/UniversalHeader';
import { AppErrorHandler } from '../utils/AppErrorHandler';

type Role = 'supervisor' | 'engineer';

interface User {
  id: string;
  name: string;
  role: Role;
}

type IncidentStatus = 'Open' | 'In Progress' | 'Resolved';
type IncidentPriority = 'Low' | 'Medium' | 'High';

interface Incident {
  id: string;              // e.g. "INC-000123"
  title: string;           // short title
  location: string;        // where it happened
  description: string;     // details
  priority: IncidentPriority;
  status: IncidentStatus;
  created_at: string;      // ISO
  raised_by: string;       // user name/id
}

export default function Incidents() {
  // When scanning an incident QR (or any QR you decide to route here):
  // /incidents?scanned=1&t=incident&id=INC-000123
  const params = useLocalSearchParams<{ scanned?: string; t?: string; id?: string }>();
  const [scanId, setScanId] = useState<string>('');

  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | IncidentStatus>('All');

  // Create incident modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<IncidentPriority>('Medium');

  useEffect(() => {
    if (params.scanned === '1' && params.id) {
      setScanId(String(params.id));
    }
  }, [params.scanned, params.id]);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) fetchIncidents();
  }, [user]);

  const initializeUser = async () => {
    try {
      const ud = await AsyncStorage.getItem('userData');
      if (!ud) return router.replace('/');
      const parsed = JSON.parse(ud);
      setUser(parsed);
    } catch (e) {
      console.error('Error loading user', e);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchIncidents = async () => {
    try {
      // Mock data for now
      const mock: Incident[] = [
        {
          id: 'INC-000123',
          title: 'Water leak – Level 2',
          location: 'Level 2, outside Unit 14',
          description: 'Ceiling tile stained. Small drip observed.',
          priority: 'High',
          status: 'Open',
          created_at: '2025-01-16T08:45:00Z',
          raised_by: 'Lee Paull',
        },
        {
          id: 'INC-000124',
          title: 'Broken light fitting',
          location: 'Core 8 stairwell',
          description: 'Tube flickering; ballast suspected.',
          priority: 'Medium',
          status: 'In Progress',
          created_at: '2025-01-15T14:10:00Z',
          raised_by: 'Dean Turnill',
        },
        {
          id: 'INC-000125',
          title: 'Trip hazard – loose tile',
          location: 'Main mall near entrance',
          description: 'Floor tile lifting by 5mm.',
          priority: 'Low',
          status: 'Resolved',
          created_at: '2025-01-14T10:00:00Z',
          raised_by: 'Luis',
        },
      ];
      setIncidents(mock);
    } catch (e) {
      console.error('Error fetching incidents', e);
      AppErrorHandler.handleError(e as Error, 'Failed to load incidents');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIncidents();
    setRefreshing(false);
  };

  const priorityColor = (p: IncidentPriority) =>
    p === 'High' ? '#F44336' : p === 'Medium' ? '#FF9800' : '#4CAF50';

  const statusColor = (s: IncidentStatus) =>
    s === 'Open' ? '#EF4444' : s === 'In Progress' ? '#F59E0B' : '#22C55E';

  const filtered = incidents.filter((i) => {
    const q = search.toLowerCase();
    const matchesSearch =
      i.id.toLowerCase().includes(q) ||
      i.title.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q);
    const matchesFilter = filter === 'All' || i.status === filter;
    const matchesScan = !scanId || i.id.includes(scanId);
    return matchesSearch && matchesFilter && matchesScan;
  });

  const canCreate = user?.role === 'supervisor' || user?.role === 'engineer';

  const createIncident = () => {
    if (!newTitle.trim() || !newLocation.trim()) {
      return Alert.alert('Missing info', 'Title and Location are required');
    }
    const newItem: Incident = {
      id: `INC-${String(Date.now()).slice(-6)}`,
      title: newTitle.trim(),
      location: newLocation.trim(),
      description: newDesc.trim(),
      priority: newPriority,
      status: 'Open',
      created_at: new Date().toISOString(),
      raised_by: user?.name || 'Unknown',
    };
    setIncidents((prev) => [newItem, ...prev]);
    setShowCreate(false);
    setNewTitle('');
    setNewLocation('');
    setNewDesc('');
    setNewPriority('Medium');
    Alert.alert('Created', `${newItem.id} raised`);
  };

  if (loading) {
    return (
      <Screen scroll>
        <Container>
          <UniversalHeader title="Incidents" showBackButton />
          <View style={styles.centerContent}>
            <Ionicons name="alert-circle" size={48} color="#F59E0B" />
            <Text style={styles.loadingText}>Loading incidents…</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Container>
        <UniversalHeader title="Incidents" showBackButton />

        {/* Top actions */}
        <View style={styles.topRow}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#777" />
            <TextInput
              placeholder="Search incidents…"
              placeholderTextColor="#777"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() =>
              setFilter((prev) =>
                prev === 'All' ? 'Open' : prev === 'Open' ? 'In Progress' : prev === 'In Progress' ? 'Resolved' : 'All'
              )
            }
          >
            <Ionicons name="funnel-outline" size={18} color="#fff" />
            <Text style={styles.filterTxt}>{filter}</Text>
          </TouchableOpacity>

          {canCreate && (
            <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreate(true)}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.newTxt}>New</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {filtered.map((i) => (
            <View
              key={i.id}
              style={[
                styles.card,
                scanId && i.id === scanId ? { borderWidth: 2, borderColor: '#4CAF50' } : null,
              ]}
            >
              <View style={styles.headerRow}>
                <Text style={styles.id}>{i.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(i.status) }]}>
                  <Text style={styles.statusTxt}>{i.status}</Text>
                </View>
              </View>

              <Text style={styles.title}>{i.title}</Text>
              <Text style={styles.meta}>Location: {i.location}</Text>
              <Text style={styles.meta}>Priority: <Text style={{ color: priorityColor(i.priority) }}>{i.priority}</Text></Text>
              <Text style={styles.desc}>{i.description}</Text>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert('Incident', `Viewing ${i.id}`)}>
                  <Ionicons name="eye" size={18} color="#2196F3" />
                  <Text style={[styles.actionTxt, { color: '#2196F3' }]}>View</Text>
                </TouchableOpacity>

                {user?.role === 'supervisor' && i.status !== 'Resolved' && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() =>
                      setIncidents((prev) =>
                        prev.map((x) => (x.id === i.id ? { ...x, status: 'Resolved' } : x))
                      )
                    }
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                    <Text style={[styles.actionTxt, { color: '#22C55E' }]}>Resolve</Text>
                  </TouchableOpacity>
                )}
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

        {/* Create Modal */}
        <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Incident</Text>
                <TouchableOpacity onPress={() => setShowCreate(false)}>
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 12 }}>
                <View style={styles.inputRow}>
                  <Ionicons name="create-outline" size={18} color="#aaa" />
                  <TextInput
                    style={styles.input}
                    placeholder="Title *"
                    placeholderTextColor="#777"
                    value={newTitle}
                    onChangeText={setNewTitle}
                  />
                </View>
                <View style={styles.inputRow}>
                  <Ionicons name="location-outline" size={18} color="#aaa" />
                  <TextInput
                    style={styles.input}
                    placeholder="Location *"
                    placeholderTextColor="#777"
                    value={newLocation}
                    onChangeText={setNewLocation}
                  />
                </View>
                <View style={[styles.inputRow, { alignItems: 'flex-start' }]}>
                  <Ionicons name="document-text-outline" size={18} color="#aaa" style={{ marginTop: 6 }} />
                  <TextInput
                    style={[styles.input, { minHeight: 80 }]}
                    placeholder="Description"
                    placeholderTextColor="#777"
                    value={newDesc}
                    onChangeText={setNewDesc}
                    multiline
                  />
                </View>

                <View style={styles.priorityRow}>
                  {(['Low', 'Medium', 'High'] as IncidentPriority[]).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.pill,
                        newPriority === p ? { backgroundColor: priorityColor(p) } : null,
                      ]}
                      onPress={() => setNewPriority(p)}
                    >
                      <Text style={styles.pillTxt}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.btn, { backgroundColor: '#666' }]} onPress={() => setShowCreate(false)}>
                  <Text style={styles.btnTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, { backgroundColor: '#3B82F6' }]} onPress={createIncident}>
                  <Text style={styles.btnTxt}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#fff' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 20, paddingBottom: 0 },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 6 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#475569',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  filterTxt: { color: '#fff', fontWeight: '700' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  newTxt: { color: '#fff', fontWeight: '800' },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  card: { backgroundColor: '#2d2d2d', borderRadius: 16, padding: 16, marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  id: { color: '#fff', fontWeight: '800' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  statusTxt: { color: '#fff', fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 6 },
  meta: { color: '#bbb', fontSize: 13, marginTop: 2 },
  desc: { color: '#ddd', fontSize: 13, marginTop: 6 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#404040',
    paddingTop: 12,
    marginTop: 8,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  actionTxt: { fontSize: 14, fontWeight: '600' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: '#1e1e1e', borderRadius: 16, padding: 16, width: '90%', gap: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 6 },
  priorityRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  pill: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 9999, backgroundColor: '#374151' },
  pillTxt: { color: '#fff', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
  btnTxt: { color: '#fff', fontWeight: '800' },
});

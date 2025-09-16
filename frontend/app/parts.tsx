// frontend/app/parts.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from './components/Screen';
import Container from './components/Container';
import UniversalHeader from './components/UniversalHeader';
import { AppErrorHandler } from '../utils/AppErrorHandler';

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

interface Part {
  id: string;        // e.g., "PART-001"
  name: string;      // e.g., "Light Bulb"
  stock: number;     // e.g., 20
  location: string;  // e.g., "Workshop Shelf A"
}

export default function Parts() {
  // scanner redirect: /parts?scanned=1&t=part&id=PART-001
  const params = useLocalSearchParams<{ scanned?: string; t?: string; id?: string }>();
  const [scanFilter, setScanFilter] = useState<string>('');

  const [user, setUser] = useState<User | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (params.scanned === '1' && params.id) {
      setScanFilter(String(params.id));
    }
  }, [params.scanned, params.id]);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) fetchParts();
  }, [user]);

  const initializeUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) return router.replace('/');
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchParts = async () => {
    try {
      // mock parts
      const mock: Part[] = [
        { id: 'PART-001', name: 'LED Tube Light', stock: 20, location: 'Workshop Shelf A' },
        { id: 'PART-002', name: 'Fuse 5A', stock: 50, location: 'Workshop Drawer 1' },
        { id: 'PART-003', name: 'Ceiling Tile', stock: 10, location: 'Core 8 Storage' },
      ];
      setParts(mock);
    } catch (err) {
      console.error('Error fetching parts:', err);
      AppErrorHandler.handleError(err as Error, 'Failed to load parts');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchParts();
    setRefreshing(false);
  };

  const filteredParts = parts.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q);

    const matchesScan = !scanFilter || p.id.includes(scanFilter);
    return matchesSearch && matchesScan;
  });

  if (loading) {
    return (
      <Screen scroll>
        <Container>
          <UniversalHeader title="Parts" showBackButton />
          <View style={styles.centerContent}>
            <Ionicons name="construct" size={48} color="#4CAF50" />
            <Text style={styles.loadingText}>Loading parts...</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Container>
        <UniversalHeader title="Parts" showBackButton />

        {/* Search bar */}
        <View style={styles.searchSection}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search parts..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Parts list */}
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredParts.map((part) => (
            <View
              key={part.id}
              style={[
                styles.partCard,
                scanFilter && part.id === scanFilter
                  ? { borderWidth: 2, borderColor: '#4CAF50' }
                  : null,
              ]}
            >
              <View style={styles.partHeader}>
                <Text style={styles.partName}>{part.name}</Text>
                <Text style={styles.partId}>{part.id}</Text>
              </View>

              <Text style={styles.partDetail}>Stock: {part.stock}</Text>
              <Text style={styles.partDetail}>Location: {part.location}</Text>

              <View style={styles.partActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => Alert.alert('Part', `Viewing ${part.name}`)}
                >
                  <Ionicons name="eye" size={18} color="#2196F3" />
                  <Text style={[styles.actionText, { color: '#2196F3' }]}>View</Text>
                </TouchableOpacity>

                {user?.role === 'supervisor' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Alert.alert('Edit', 'Edit part flow not implemented yet')}
                  >
                    <Ionicons name="create" size={18} color="#FF9800" />
                    <Text style={[styles.actionText, { color: '#FF9800' }]}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {filteredParts.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color="#666" />
              <Text style={styles.emptyTitle}>No Parts Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try adjusting your search criteria' : 'No parts available.'}
              </Text>
            </View>
          )}
        </ScrollView>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: '#fff', fontSize: 18 },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    paddingHorizontal: 16,
    margin: 20,
    gap: 12,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 12 },
  content: { flex: 1, paddingHorizontal: 20 },
  partCard: { backgroundColor: '#2d2d2d', borderRadius: 16, padding: 16, marginBottom: 16 },
  partHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  partName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  partId: { color: '#aaa', fontSize: 14 },
  partDetail: { color: '#aaa', fontSize: 14, marginBottom: 4 },
  partActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#404040',
    paddingTop: 12,
    marginTop: 8,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  actionText: { fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  emptyText: { color: '#aaa', fontSize: 16, textAlign: 'center', lineHeight: 22 },
});

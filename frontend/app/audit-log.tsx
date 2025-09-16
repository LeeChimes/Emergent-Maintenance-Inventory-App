// frontend/app/audit-log.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Screen from './components/Screen';
import Container from './components/Container';
import UniversalHeader from './components/UniversalHeader';
import { AppErrorHandler } from '../utils/AppErrorHandler';

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

interface AuditEntry {
  id: string;
  action: string;
  timestamp: string;
  user: string;
}

export default function AuditLog() {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) fetchEntries();
  }, [user]);

  const initializeUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) return router.replace('/');
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (err) {
      console.error('Error loading user', err);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      // Mock data until backend wired
      const mock: AuditEntry[] = [
        { id: '1', action: 'Completed PPM FD-CORE8-012', timestamp: '2025-01-16 09:30', user: 'Lee Carter' },
        { id: '2', action: 'Issued Tool: Drill #4', timestamp: '2025-01-15 14:20', user: 'Dean Turnill' },
        { id: '3', action: 'Received Delivery DEL-001', timestamp: '2025-01-14 11:10', user: 'Luis' },
      ];
      setEntries(mock);
    } catch (err) {
      console.error('Error fetching audit log', err);
      AppErrorHandler.handleError(err as Error, 'Failed to load audit log');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEntries();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Screen>
        <Container>
          <UniversalHeader title="Audit Log" showBackButton />
          <View style={styles.centerContent}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading activity…</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen>
      <Container>
        <UniversalHeader title="Audit Log" showBackButton />

        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {entries.map((e) => (
            <View key={e.id} style={styles.card}>
              <View style={styles.headerRow}>
                <Ionicons name="time-outline" size={18} color="#aaa" />
                <Text style={styles.timestamp}>{e.timestamp}</Text>
              </View>
              <Text style={styles.action}>{e.action}</Text>
              <Text style={styles.user}>By: {e.user}</Text>
            </View>
          ))}

          {entries.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={64} color="#666" />
              <Text style={styles.emptyTxt}>No audit entries found</Text>
            </View>
          )}
        </ScrollView>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#fff' },
  content: { padding: 20 },
  card: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timestamp: { color: '#aaa', fontSize: 12 },
  action: { color: '#fff', fontWeight: '600' },
  user: { color: '#aaa', fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTxt: { color: '#aaa' },
});

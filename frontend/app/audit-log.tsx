// frontend/app/audit-log.tsx
import React, { useEffect, useState } from 'react';
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
  user: string;
  action: string;
  timestamp: string; // ISO string
}

export default function AuditLog() {
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) fetchLogs();
  }, [user]);

  const initializeUser = async () => {
    try {
      const ud = await AsyncStorage.getItem('userData');
      if (!ud) return router.replace('/');
      const parsed = JSON.parse(ud);
      setUser(parsed);
    } catch (err) {
      console.error('Error loading user data', err);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      // mock data for now
      const mock: AuditEntry[] = [
        { id: '1', user: 'Lee Carter', action: 'Completed Fire Door PPM', timestamp: '2025-01-16T09:30:00Z' },
        { id: '2', user: 'Dan Carter', action: 'Added new user: Luis', timestamp: '2025-01-15T14:05:00Z' },
        { id: '3', user: 'Dean Turnill', action: 'Updated stock: LED Tube Light', timestamp: '2025-01-14T11:20:00Z' },
      ];
      setLogs(mock);
    } catch (err) {
      console.error('Error fetching audit logs', err);
      AppErrorHandler.handleError(err as Error, 'Failed to load audit logs');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Screen scroll>
        <Container>
          <UniversalHeader title="Audit Log" showBackButton />
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingTxt}>Loading audit trail...</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Container>
        <UniversalHeader title="Audit Log" showBackButton />

        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {logs.map((entry) => (
            <View key={entry.id} style={styles.card}>
              <View style={styles.row}>
                <Ionicons name="person" size={18} color="#4CAF50" />
                <Text style={styles.user}>{entry.user}</Text>
              </View>
              <Text style={styles.action}>{entry.action}</Text>
              <Text style={styles.timestamp}>
                {new Date(entry.timestamp).toLocaleString()}
              </Text>
            </View>
          ))}

          {logs.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={64} color="#666" />
              <Text style={styles.emptyTxt}>No audit entries</Text>
            </View>
          )}
        </ScrollView>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingTxt: { color: '#aaa' },
  content: { padding: 20 },
  card: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  user: { color: '#fff', fontWeight: '700', fontSize: 15 },
  action: { color: '#ddd', fontSize: 14, marginBottom: 4 },
  timestamp: { color: '#aaa', fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTxt: { color: '#aaa' },
});

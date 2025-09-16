// frontend/app/maintenance-hub.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Screen from './components/Screen';
import Container from './components/Container';
import UniversalHeader from './components/UniversalHeader';

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

export default function MaintenanceHub() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  if (loading) {
    return (
      <Screen>
        <Container>
          <UniversalHeader title="Supervisor Hub" />
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingTxt}>Loading supervisor hub…</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen>
      <Container>
        <UniversalHeader title="Supervisor Hub" />

        <ScrollView style={styles.content}>
          <Text style={styles.welcome}>
            Welcome back, {user?.name ?? 'Supervisor'} 🛠️
          </Text>

          {/* Quick Links */}
          <Text style={styles.section}>Team & Tasks</Text>
          <View style={styles.grid}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/ppms')}
            >
              <Ionicons name="calendar" size={28} color="#4CAF50" />
              <Text style={styles.cardTxt}>PPMs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/incidents')}
            >
              <Ionicons name="alert-circle" size={28} color="#FF9800" />
              <Text style={styles.cardTxt}>Incidents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/inventory')}
            >
              <Ionicons name="cube" size={28} color="#2196F3" />
              <Text style={styles.cardTxt}>Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/parts')}
            >
              <Ionicons name="construct" size={28} color="#9C27B0" />
              <Text style={styles.cardTxt}>Parts</Text>
            </TouchableOpacity>
          </View>

          {/* Supervisor Tools */}
          <Text style={styles.section}>Supervisor Tools</Text>
          <View style={styles.grid}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/user-management')}
            >
              <Ionicons name="people" size={28} color="#4CAF50" />
              <Text style={styles.cardTxt}>User Management</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/audit-log')}
            >
              <Ionicons name="document-text" size={28} color="#2196F3" />
              <Text style={styles.cardTxt}>Audit Log</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push('/admin-exports')}
            >
              <Ionicons name="download" size={28} color="#FF9800" />
              <Text style={styles.cardTxt}>Exports</Text>
            </TouchableOpacity>
          </View>

          {/* AI Help */}
          <Text style={styles.section}>Need Help?</Text>
          <TouchableOpacity
            style={[styles.card, { flexDirection: 'row', gap: 12 }]}
            onPress={() => router.push('/ai-help')}
          >
            <Ionicons name="chatbubble-ellipses" size={28} color="#4CAF50" />
            <Text style={styles.cardTxt}>Ask AI Assistant</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingTxt: { color: '#aaa' },
  content: { padding: 20 },
  welcome: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 8,
    opacity: 0.9,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flexBasis: '47%',
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

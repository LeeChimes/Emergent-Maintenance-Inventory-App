// frontend/app/dashboard.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Screen from './components/Screen';
import Container from './components/Container';
import UniversalHeader from './components/UniversalHeader';

type Role = 'supervisor' | 'engineer';

interface User {
  id: string;
  name: string;
  role: Role;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <Screen>
        <Container>
          <UniversalHeader title="Dashboard" />
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.dim}>Loading…</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen>
      <Container>
        <UniversalHeader title="Dashboard" />
        <ScrollView style={styles.content}>
          <Text style={styles.welcome}>Welcome, {user?.name ?? 'User'} 👋</Text>

          <Text style={styles.section}>Quick Links</Text>
          <View style={styles.grid}>
            <Card icon="calendar" color="#4CAF50" label="PPMs" onPress={() => router.push('/ppms')} />
            <Card icon="alert-circle" color="#FF9800" label="Incidents" onPress={() => router.push('/incidents')} />
            <Card icon="cube" color="#2196F3" label="Inventory" onPress={() => router.push('/inventory')} />
            <Card icon="construct" color="#9C27B0" label="Parts" onPress={() => router.push('/parts')} />
          </View>

          <Text style={styles.section}>Help & Tools</Text>
          <View style={styles.grid}>
            <Card icon="help-circle" color="#22C55E" label="Help" onPress={() => router.push('/help')} />
            <Card icon="qr-code" color="#60A5FA" label="Scanner" onPress={() => router.push('/scan')} />
            {user?.role === 'supervisor' && (
              <>
                <Card icon="people" color="#34D399" label="Users" onPress={() => router.push('/user-management')} />
                <Card icon="document-text" color="#3B82F6" label="Audit Log" onPress={() => router.push('/audit-log')} />
                <Card icon="download" color="#F59E0B" label="Exports" onPress={() => router.push('/admin-exports')} />
              </>
            )}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </Container>
    </Screen>
  );
}

function Card({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Ionicons name={icon} size={28} color={color} />
      <Text style={styles.cardTxt}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  dim: { color: '#aaa' },
  content: { padding: 20 },
  welcome: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  section: { color: '#fff', fontSize: 14, fontWeight: '800', marginBottom: 8, opacity: 0.9 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexBasis: '47%',
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardTxt: { color: '#fff', fontWeight: '700' },
});

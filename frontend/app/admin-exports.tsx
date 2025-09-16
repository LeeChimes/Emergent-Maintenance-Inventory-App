// frontend/app/admin-exports.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
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

export default function AdminExports() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeUser();
  }, []);

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

  const handleExport = (type: string) => {
    Alert.alert('Export', `Exporting ${type} report...`);
    // Later: hook into backend and actually generate report
  };

  if (loading) {
    return (
      <Screen scroll>
        <Container>
          <UniversalHeader title="Admin Exports" showBackButton />
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingTxt}>Loading...</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  if (user?.role !== 'supervisor') {
    return (
      <Screen scroll>
        <Container>
          <UniversalHeader title="Admin Exports" showBackButton />
          <View style={styles.center}>
            <Ionicons name="lock-closed" size={48} color="#F44336" />
            <Text style={styles.denyTxt}>Access Denied</Text>
            <Text style={styles.subTxt}>Supervisor access required</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Container>
        <UniversalHeader title="Admin Exports" showBackButton />

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Reports</Text>

          <TouchableOpacity
            style={styles.card}
            onPress={() => handleExport('PPM Schedules')}
          >
            <Ionicons name="calendar" size={22} color="#4CAF50" />
            <Text style={styles.cardTxt}>PPM Schedules</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => handleExport('Incident Reports')}
          >
            <Ionicons name="alert-circle" size={22} color="#FF9800" />
            <Text style={styles.cardTxt}>Incident Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => handleExport('Audit Log')}
          >
            <Ionicons name="document-text" size={22} color="#2196F3" />
            <Text style={styles.cardTxt}>Audit Log</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => handleExport('Parts & Inventory')}
          >
            <Ionicons name="cube" size={22} color="#9C27B0" />
            <Text style={styles.cardTxt}>Parts & Inventory</Text>
          </TouchableOpacity>
        </ScrollView>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingTxt: { color: '#aaa' },
  denyTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  subTxt: { color: '#aaa', fontSize: 14 },
  content: { padding: 20 },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  cardTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

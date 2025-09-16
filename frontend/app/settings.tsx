// frontend/app/settings.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
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

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // simple local settings
  const [pushEnabled, setPushEnabled] = useState(true);
  const [photoRequired, setPhotoRequired] = useState(false); // e.g., require photo before completing PPM
  const [scanRequired, setScanRequired] = useState(false);   // e.g., require QR scan before completing PPM

  useEffect(() => {
    (async () => {
      try {
        const ud = await AsyncStorage.getItem('userData');
        if (!ud) return router.replace('/');
        const parsed: User = JSON.parse(ud);
        setUser(parsed);

        // load local toggles (optional persistence)
        const storedPush = await AsyncStorage.getItem('settings.pushEnabled');
        const storedPhoto = await AsyncStorage.getItem('settings.photoRequired');
        const storedScan = await AsyncStorage.getItem('settings.scanRequired');
        if (storedPush !== null) setPushEnabled(storedPush === '1');
        if (storedPhoto !== null) setPhotoRequired(storedPhoto === '1');
        if (storedScan !== null) setScanRequired(storedScan === '1');
      } catch (e) {
        console.error('Error loading settings', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const togglePersist = async (key: string, value: boolean) => {
    try {
      await AsyncStorage.setItem(key, value ? '1' : '0');
    } catch (e) {
      console.error('Error saving setting', e);
    }
  };

  const onLogout = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      router.replace('/');
    } catch (e) {
      Alert.alert('Error', 'Could not log out. Try again.');
    }
  };

  if (loading) {
    return (
      <Screen scroll>
        <Container>
          <UniversalHeader title="Settings" showBackButton />
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.loadingTxt}>Loading settings…</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Container>
        <UniversalHeader title="Settings" showBackButton />

        <ScrollView style={styles.content}>
          {/* Profile */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="person-circle-outline" size={28} color="#4CAF50" />
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{user?.name ?? 'Unknown'}</Text>
                <Text style={styles.subtitle}>Role: {user?.role ?? '-'}</Text>
              </View>
            </View>
          </View>

          {/* App Toggles */}
          <Text style={styles.section}>App</Text>
          <View style={styles.card}>
            <View style={styles.item}>
              <View style={styles.itemLeft}>
                <Ionicons name="notifications-outline" size={20} color="#9CA3AF" />
                <Text style={styles.itemText}>Push notifications</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={(v) => {
                  setPushEnabled(v);
                  togglePersist('settings.pushEnabled', v);
                }}
              />
            </View>

            <View style={styles.item}>
              <View style={styles.itemLeft}>
                <Ionicons name="camera-outline" size={20} color="#9CA3AF" />
                <Text style={styles.itemText}>Require photo before completing PPM</Text>
              </View>
              <Switch
                value={photoRequired}
                onValueChange={(v) => {
                  setPhotoRequired(v);
                  togglePersist('settings.photoRequired', v);
                }}
              />
            </View>

            <View style={styles.item}>
              <View style={styles.itemLeft}>
                <Ionicons name="qr-code-outline" size={20} color="#9CA3AF" />
                <Text style={styles.itemText}>Require scan before completing PPM</Text>
              </View>
              <Switch
                value={scanRequired}
                onValueChange={(v) => {
                  setScanRequired(v);
                  togglePersist('settings.scanRequired', v);
                }}
              />
            </View>
          </View>

          {/* Supervisor Tools */}
          {user?.role === 'supervisor' && (
            <>
              <Text style={styles.section}>Supervisor</Text>
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => router.push('/admin-exports')}
                >
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.navBtnTxt}>Admin Exports</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => router.push('/audit-log')}
                >
                  <Ionicons name="document-text-outline" size={20} color="#fff" />
                  <Text style={styles.navBtnTxt}>Audit Log</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => router.push('/user-management')}
                >
                  <Ionicons name="people-outline" size={20} color="#fff" />
                  <Text style={styles.navBtnTxt}>User Management</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Danger Zone */}
          <Text style={styles.section}>Account</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.navBtn, { backgroundColor: '#EF4444' }]}
              onPress={onLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.navBtnTxt}>Log out</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingTxt: { color: '#aaa' },
  content: { padding: 20 },
  section: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 8,
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#333',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: '#fff', fontSize: 16, fontWeight: '800' },
  subtitle: { color: '#9CA3AF', fontSize: 13 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemText: { color: '#E5E7EB', fontSize: 15 },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  navBtnTxt: { color: '#fff', fontWeight: '800' },
});

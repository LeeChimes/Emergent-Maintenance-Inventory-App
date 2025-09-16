// frontend/app/bulk-upload.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

export default function BulkUpload() {
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
          <UniversalHeader title="Bulk Upload" showBackButton />
          <Text style={{ color: '#aaa' }}>Loading…</Text>
        </Container>
      </Screen>
    );
  }

  if (user?.role !== 'supervisor') {
    return (
      <Screen>
        <Container>
          <UniversalHeader title="Bulk Upload" showBackButton />
          <View style={styles.center}>
            <Ionicons name="lock-closed" size={48} color="#F44336" />
            <Text style={styles.denyTxt}>Access Denied</Text>
            <Text style={styles.subTxt}>Supervisor access required</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  const handleBulkUpload = () => {
    Alert.alert('Info', 'Bulk upload not yet implemented.');
  };

  return (
    <Screen>
      <Container>
        <UniversalHeader title="Bulk Upload" showBackButton />
        <View style={styles.center}>
          <Ionicons name="cloud-upload" size={64} color="#4CAF50" />
          <Text style={styles.title}>Bulk Upload</Text>
          <Text style={styles.subtitle}>
            This feature will allow supervisors to upload inventory/parts lists
            via spreadsheet.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={handleBulkUpload}>
            <Text style={styles.btnTxt}>Upload File</Text>
          </TouchableOpacity>
        </View>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  subtitle: { color: '#aaa', fontSize: 14, textAlign: 'center' },
  btn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  denyTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  subTxt: { color: '#aaa', fontSize: 14 },
});

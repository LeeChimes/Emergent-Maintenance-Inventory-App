// frontend/app/add-item.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
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

export default function AddItem() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [category, setCategory] = useState('');

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

  const handleAdd = () => {
    if (!name.trim() || !qty.trim() || !category.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    Alert.alert('Success', `${name} added to inventory (mock only).`);
    setName('');
    setQty('');
    setCategory('');
    router.back();
  };

  if (loading) {
    return (
      <Screen>
        <Container>
          <UniversalHeader title="Add Item" showBackButton />
          <Text style={{ color: '#aaa' }}>Loading…</Text>
        </Container>
      </Screen>
    );
  }

  if (user?.role !== 'supervisor') {
    return (
      <Screen>
        <Container>
          <UniversalHeader title="Add Item" showBackButton />
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
        <UniversalHeader title="Add Item" showBackButton />
        <ScrollView style={styles.content}>
          <TextInput
            style={styles.input}
            placeholder="Item Name"
            placeholderTextColor="#777"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Quantity"
            placeholderTextColor="#777"
            keyboardType="numeric"
            value={qty}
            onChangeText={setQty}
          />
          <TextInput
            style={styles.input}
            placeholder="Category"
            placeholderTextColor="#777"
            value={category}
            onChangeText={setCategory}
          />

          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnTxt}>Add Item</Text>
          </TouchableOpacity>
        </ScrollView>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  input: {
    backgroundColor: '#2d2d2d',
    color: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  addBtn: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  addBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  denyTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  subTxt: { color: '#aaa', fontSize: 14 },
});

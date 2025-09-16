// frontend/app/user-management.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
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
  pin: string;
}

export default function UserManagement() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'supervisor' | 'engineer'>('engineer');
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const ud = await AsyncStorage.getItem('userData');
        if (!ud) return router.replace('/');
        const parsed = JSON.parse(ud);
        setCurrentUser(parsed);

        // mock stored users (later: load from backend)
        setUsers([
          { id: '1', name: 'Admin', role: 'supervisor', pin: '1234' },
          { id: '2', name: 'Engineer', role: 'engineer', pin: '5678' },
        ]);
      } catch (e) {
        console.error('Error loading user data', e);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const validatePin = (pin: string): string => {
    if (!pin) return 'PIN is required';
    if (pin.length !== 4) return 'PIN must be exactly 4 digits';
    if (!/^[0-9]+$/.test(pin)) return 'PIN must contain only numbers';
    return '';
  };

  const handleAddUser = () => {
    const error = validatePin(newPin);
    setPinError(error);
    if (!newName.trim() || error) return;

    if (users.find((u) => u.name.toLowerCase() === newName.toLowerCase())) {
      Alert.alert('Error', 'A user with this name already exists.');
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: newName.trim(),
      role: newRole,
      pin: newPin,
    };
    setUsers((prev) => [...prev, newUser]);
    setShowModal(false);
    setNewName('');
    setNewRole('engineer');
    setNewPin('');
    setPinError('');
    Alert.alert('Success', 'User added successfully!');
  };

  const handleDeleteUser = (id: string) => {
    Alert.alert('Confirm', 'Delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setUsers((prev) => prev.filter((u) => u.id !== id)),
      },
    ]);
  };

  if (loading) {
    return (
      <Screen scroll>
        <Container>
          <UniversalHeader title="User Management" showBackButton />
          <Text style={{ color: '#aaa' }}>Loading...</Text>
        </Container>
      </Screen>
    );
  }

  if (currentUser?.role !== 'supervisor') {
    return (
      <Screen scroll>
        <Container>
          <UniversalHeader title="User Management" showBackButton />
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
        <UniversalHeader title="User Management" showBackButton />

        <ScrollView style={styles.content}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.addBtnTxt}>+ Add User</Text>
          </TouchableOpacity>

          {users.map((u) => (
            <View key={u.id} style={styles.userCard}>
              <View>
                <Text style={styles.userName}>{u.name}</Text>
                <Text style={styles.userRole}>{u.role}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteUser(u.id)}>
                <Ionicons name="trash" size={22} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Add User Modal */}
        <Modal visible={showModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Add User</Text>

              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#777"
                value={newName}
                onChangeText={setNewName}
              />

              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[
                    styles.roleOpt,
                    newRole === 'engineer' && styles.roleOptSelected,
                  ]}
                  onPress={() => setNewRole('engineer')}
                >
                  <Text
                    style={
                      newRole === 'engineer'
                        ? styles.roleTxtSelected
                        : styles.roleTxt
                    }
                  >
                    Engineer
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOpt,
                    newRole === 'supervisor' && styles.roleOptSelected,
                  ]}
                  onPress={() => setNewRole('supervisor')}
                >
                  <Text
                    style={
                      newRole === 'supervisor'
                        ? styles.roleTxtSelected
                        : styles.roleTxt
                    }
                  >
                    Supervisor
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="4-digit PIN"
                placeholderTextColor="#777"
                keyboardType="numeric"
                maxLength={4}
                value={newPin}
                onChangeText={setNewPin}
              />
              {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: '#666' }]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.btnTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: '#4CAF50' }]}
                  onPress={handleAddUser}
                >
                  <Text style={styles.btnTxt}>Add</Text>
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
  content: { padding: 20 },
  addBtn: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  userRole: { color: '#aaa', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    width: '100%',
    padding: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#3d3d3d',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  roleOpt: {
    flex: 1,
    backgroundColor: '#3d3d3d',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  roleOptSelected: { backgroundColor: '#4CAF50' },
  roleTxt: { color: '#aaa', fontSize: 14 },
  roleTxtSelected: { color: '#fff', fontWeight: 'bold' },
  pinError: { color: '#F44336', marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  btnTxt: { color: '#fff', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  denyTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  subTxt: { color: '#aaa', fontSize: 14 },
});

// frontend/app/user-management.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { AppErrorHandler } from '../utils/AppErrorHandler';

type Role = 'engineer' | 'supervisor';

interface User {
  id: string;
  name: string;
  role: Role;
  pin: string;
}

type Mode = 'add' | 'edit';

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ||
  process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/+$/, '') ||
  'http://localhost:8040';

const USERS_ENDPOINT = `${API_BASE}/api/users`;

export default function UserManagementScreen() {
  // demo role from query: /user-management?role=supervisor
  const params = useLocalSearchParams<{ role?: string }>();
  const currentUserRole: Role = (params.role === 'engineer' ? 'engineer' : 'supervisor') as Role;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [mode, setMode] = useState<Mode>('add');
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('engineer');
  const [newUserPin, setNewUserPin] = useState('');
  const [pinError, setPinError] = useState('');

  const [showPins, setShowPins] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2200);
  };

  const api = useMemo(() => {
    return {
      async list(): Promise<User[]> {
        const result = await AppErrorHandler.safeNetworkCall(USERS_ENDPOINT, {}, 'Fetch users');
        return result || [];
      },
      async create(payload: Omit<User, 'id'>): Promise<User> {
        const result = await AppErrorHandler.safeNetworkCall(USERS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }, 'Create user');
        return result;
      },
      async update(id: string, payload: Partial<Omit<User, 'id'>>): Promise<User> {
        const result = await AppErrorHandler.safeNetworkCall(`${USERS_ENDPOINT}/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }, 'Update user');
        return result;
      },
      async remove(id: string): Promise<void> {
        await AppErrorHandler.safeNetworkCall(`${USERS_ENDPOINT}/${encodeURIComponent(id)}`, { method: 'DELETE' }, 'Delete user');
      },
    };
  }, []);

  // initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.list();
        if (mounted) setUsers(data);
      } catch (e) {
        showToast('error', 'Could not load users.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [api]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const data = await api.list();
      setUsers(data);
    } catch {
      showToast('error', 'Refresh failed.');
    } finally {
      setRefreshing(false);
    };
  };

  const validatePin = (pin: string) => {
    if (!pin) return 'PIN is required';
    if (pin.length !== 4) return 'PIN must be exactly 4 digits';
    if (!/^[0-9]+$/.test(pin)) return 'PIN must contain only numbers';
    return '';
  };

  const hasDuplicateName = (name: string, excludeId?: string) => {
    const t = name.trim().toLowerCase();
    return users.some((u) => u.name.trim().toLowerCase() === t && u.id !== excludeId);
  };

  const openAdd = () => {
    setMode('add');
    setEditingUserId(null);
    setNewUserName('');
    setNewUserRole('engineer');
    setNewUserPin('');
    setPinError('');
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setMode('edit');
    setEditingUserId(user.id);
    setNewUserName(user.name);
    setNewUserRole(user.role);
    setNewUserPin(user.pin);
    setPinError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setPinError('');
  };

  const handleSave = async () => {
    if (currentUserRole !== 'supervisor') {
      showToast('error', 'Access denied: supervisors only.');
      return;
    }

    const name = newUserName.trim();
    if (!name) return showToast('error', 'Name is required.');

    const pErr = validatePin(newUserPin);
    setPinError(pErr);
    if (pErr) return;

    try {
      if (mode === 'add') {
        if (hasDuplicateName(name)) return showToast('error', 'That name already exists.');
        const created = await api.create({ name, role: newUserRole, pin: newUserPin });
        setUsers((prev) => [...prev, created]);
        closeModal();
        showToast('success', 'User added.');
      } else {
        const id = editingUserId!;
        if (hasDuplicateName(name, id)) return showToast('error', 'That name already exists.');
        const updated = await api.update(id, { name, role: newUserRole, pin: newUserPin });
        setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
        closeModal();
        showToast('success', 'User updated.');
      }
    } catch (e) {
      showToast('error', 'Save failed. Check network/server.');
    }
  };

  const requestDelete = (user: User) => {
    if (currentUserRole !== 'supervisor') {
      showToast('error', 'Access denied: supervisors only.');
      return;
    }
    Alert.alert('Delete user', `Delete “${user.name}”?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(user.id) },
    ]);
  };

  const confirmDelete = async (id: string) => {
    try {
      await api.remove(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast('success', 'User deleted.');
    } catch {
      showToast('error', 'Delete failed.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator />
        <Text style={{ color: '#ccc', marginTop: 8 }}>Loading users…</Text>
      </View>
    );
  }

  if (currentUserRole !== 'supervisor') {
    return (
      <View style={[styles.screen, styles.center, { padding: 24 }]}>
        <Ionicons name="lock-closed" size={36} color="#F44336" />
        <Text style={styles.deniedTitle}>Access denied</Text>
        <Text style={styles.deniedText}>
          Only supervisors can manage users. Please contact your supervisor if you need changes.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {toast && (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toast.msg}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ marginBottom: 16 }}>
          <Ionicons name="people" size={24} color="#4CAF50" />
          <Text style={styles.title}>User Management</Text>
          <Text style={styles.subtle}>Manage team members, roles, and access</Text>
        </View>

        <View style={styles.rowBetween}>
          <TouchableOpacity style={styles.addButton} onPress={openAdd} activeOpacity={0.7}>
            <Text style={styles.addButtonText}>Add User</Text>
          </TouchableOpacity>
          <View style={styles.pinToggle}>
            <Text style={{ color: '#ccc', marginRight: 8 }}>Show PINs</Text>
            <Switch value={showPins} onValueChange={setShowPins} />
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, { flex: 2 }]}>Name</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Role</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>PIN</Text>
            <Text style={[styles.headerCell, { width: 96, textAlign: 'right' }]}>Actions</Text>
          </View>

          <FlatList
            data={users}
            keyExtractor={user => user.id}
            renderItem={({ item: user }) => (
              <View key={user.id} style={styles.userRow}>
                <Text style={[styles.cell, { flex: 2 }]} numberOfLines={1}>{user.name}</Text>
                <Text style={[styles.cell, { flex: 1 }]}>{user.role}</Text>
                <Text style={[styles.cell, { flex: 1 }]}>{showPins ? user.pin : '•'.repeat(user.pin.length)}</Text>

                <View style={[styles.cell, styles.actionsCell]}>
                  <TouchableOpacity style={[styles.iconBtn, { marginRight: 8 }]} onPress={() => openEdit(user)} accessibilityLabel={`Edit user ${user.name}`} activeOpacity={0.7}>
                    <Ionicons name="create" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.iconBtn, styles.dangerBtn]} onPress={() => requestDelete(user)} accessibilityLabel={`Delete user ${user.name}`} activeOpacity={0.7}>
                    <Ionicons name="trash" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={refreshing ? (
              <View style={[styles.center, { paddingVertical: 24 }]}>
                <ActivityIndicator />
                <Text style={{ color: '#aaa', marginTop: 8 }}>Refreshing…</Text>
              </View>
            ) : null}
          />

          <TouchableOpacity onPress={refresh} style={[styles.refreshBtn, { marginTop: users.length ? 14 : 0 }]} accessibilityLabel="Refresh user list" activeOpacity={0.7}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={{ color: '#fff', marginLeft: 6, fontWeight: '600' }}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{mode === 'add' ? 'Add New User' : 'Edit User'}</Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor="#aaa"
              value={newUserName}
              onChangeText={setNewUserName}
            />

            <View style={styles.roleOptions}>
              <TouchableOpacity
                style={[styles.roleOption, newUserRole === 'engineer' && styles.roleOptionSelected]}
                onPress={() => setNewUserRole('engineer')}
                activeOpacity={0.7}
              >
                <Text style={newUserRole === 'engineer' ? styles.roleOptionTextSelected : styles.roleOptionText}>
                  Engineer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleOption, newUserRole === 'supervisor' && styles.roleOptionSelected]}
                onPress={() => setNewUserRole('supervisor')}
                activeOpacity={0.7}
              >
                <Text style={newUserRole === 'supervisor' ? styles.roleOptionTextSelected : styles.roleOptionText}>
                  Supervisor
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="4-digit PIN"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              maxLength={4}
              value={newUserPin}
              onChangeText={setNewUserPin}
            />
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity style={styles.modalButton} onPress={closeModal} activeOpacity={0.7}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={handleSave} activeOpacity={0.7}>
                <Text style={styles.modalButtonText}>{mode === 'add' ? 'Add' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111' },
  container: { padding: 20, paddingBottom: 40 },
  center: { justifyContent: 'center', alignItems: 'center' },

  toast: { position: 'absolute', top: 12, left: 12, right: 12, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, zIndex: 50 },
  toastSuccess: { backgroundColor: '#1B5E20' },
  toastError: { backgroundColor: '#B71C1C' },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },

  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 6 },
  subtle: { color: '#aaa', marginTop: 2 },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pinToggle: { flexDirection: 'row', alignItems: 'center' },

  headerRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#222', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  headerCell: { color: '#ccc', fontSize: 13, fontWeight: '700' },

  userRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1b1b1b', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#333' },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  actionsCell: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  iconBtn: { backgroundColor: '#3B82F6', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  dangerBtn: { backgroundColor: '#EF4444' },

  refreshBtn: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: '#374151', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },

  addButton: { backgroundColor: '#2196F3', padding: 12, borderRadius: 8, alignItems: 'center', minWidth: 120 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  modalContainer: { backgroundColor: '#222', borderRadius: 12, padding: 24, width: '88%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: '#2d2d2d', color: '#fff', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },

  roleOptions: { flexDirection: 'row', marginBottom: 12 },
  roleOption: { backgroundColor: '#404040', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 },
  roleOptionSelected: { backgroundColor: '#4CAF50' },
  roleOptionText: { color: '#aaa', fontSize: 14, fontWeight: '600' },
  roleOptionTextSelected: { color: '#fff', fontSize: 14, fontWeight: '600' },

  pinError: { color: '#F44336', fontSize: 14, marginBottom: 8 },

  deniedTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 10 },
  deniedText: { color: '#bbb', textAlign: 'center', marginTop: 8 },

  modalButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

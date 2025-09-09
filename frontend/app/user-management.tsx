import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import UniversalHeader from '../components/UniversalHeader';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
  pin: string;
  created_at?: string;
  last_login?: string;
  created_by?: string;
}

interface CurrentUser {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

export default function UserManagement() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'supervisor' | 'engineer'>('engineer');
  const [newUserPin, setNewUserPin] = useState('');

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        
        // Only supervisors can access this screen
        if (user.role !== 'supervisor') {
          router.replace('/settings');
          return;
        }
        
        await fetchUsers();
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Error initializing user management:', error);
      router.replace('/settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/users`);
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserPin.trim()) {
      return;
    }

    if (newUserPin.length !== 4 || !/^\d{4}$/.test(newUserPin)) {
      return;
    }

    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUserName.trim(),
          role: newUserRole,
          pin: newUserPin,
          created_by: currentUser?.id
        }),
      });

      if (response.ok) {
        await fetchUsers();
        setShowAddModal(false);
        setNewUserName('');
        setNewUserPin('');
        setNewUserRole('engineer');
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleEditUser = async () => {
    console.log('Saving user:', { name: newUserName, role: newUserRole, pin: newUserPin });
    
    const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/users/${selectedUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newUserName,
        role: newUserRole,
        pin: newUserPin,
      }),
    });
    
    const result = await response.json();
    console.log('Server response:', result);
    
    setShowEditModal(false);
    setSelectedUser(null);
    resetForm();
    
    // Force refresh users
    const usersResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/users`);
    const updatedUsers = await usersResponse.json();
    setUsers(updatedUsers);
    console.log('Users refreshed:', updatedUsers);
  };

  const handleDeleteUser = async (userId: string) => {
    // Can't delete yourself
    if (userId === currentUser?.id) {
      return;
    }

    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setNewUserName(user.name || '');
    setNewUserRole(user.role || 'engineer');
    setNewUserPin(user.pin || '');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setNewUserName('');
    setNewUserPin('');
    setNewUserRole('engineer');
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    resetForm();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <UniversalHeader title="User Management" showBackButton={true} />
        <View style={styles.centerContent}>
          <Ionicons name="people" size={48} color="#4CAF50" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentUser || currentUser.role !== 'supervisor') {
    return (
      <SafeAreaView style={styles.container}>
        <UniversalHeader title="User Management" showBackButton={true} />
        <View style={styles.centerContent}>
          <Ionicons name="lock-closed" size={48} color="#F44336" />
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.errorSubtext}>Only supervisors can manage users</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <UniversalHeader title="User Management" showBackButton={true} />
      
      <ScrollView style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerInfo}>
            <Ionicons name="people" size={24} color="#4CAF50" />
            <Text style={styles.headerTitle}>Team Management</Text>
          </View>
          <Text style={styles.headerSubtext}>
            Manage team members, roles, and access
          </Text>
        </View>

        {/* Add User Button */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="person-add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New User</Text>
        </TouchableOpacity>

        {/* Users List */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>Team Members ({users.length})</Text>
          
          {users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <View style={[
                    styles.roleIndicator,
                    { backgroundColor: user.role === 'supervisor' ? '#4CAF50' : '#2196F3' }
                  ]}>
                    <Ionicons 
                      name={user.role === 'supervisor' ? 'shield-checkmark' : 'construct'} 
                      size={16} 
                      color="#fff" 
                    />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userRole}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.userMeta}>
                  <Text style={styles.userPin}>PIN: {user.pin || 'Not Set'}</Text>
                  {user.last_login && (
                    <Text style={styles.lastLogin}>
                      Last login: {new Date(user.last_login).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.userActions}>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => openEditModal(user)}
                >
                  <Ionicons name="create" size={20} color="#2196F3" />
                </TouchableOpacity>
                
                {user.id !== currentUser.id && (
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteUser(user.id)}
                  >
                    <Ionicons name="trash" size={20} color="#F44336" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add User Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeAddModal}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New User</Text>
            <TouchableOpacity onPress={handleAddUser}>
              <Ionicons name="checkmark" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={styles.formInput}
                value={newUserName}
                onChangeText={setNewUserName}
                placeholder="Enter full name"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Role</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity 
                  style={[
                    styles.roleOption,
                    newUserRole === 'engineer' && styles.roleOptionSelected
                  ]}
                  onPress={() => setNewUserRole('engineer')}
                >
                  <Ionicons name="construct" size={20} color={newUserRole === 'engineer' ? '#fff' : '#2196F3'} />
                  <Text style={[
                    styles.roleOptionText,
                    newUserRole === 'engineer' && styles.roleOptionTextSelected
                  ]}>Engineer</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.roleOption,
                    newUserRole === 'supervisor' && styles.roleOptionSelected
                  ]}
                  onPress={() => setNewUserRole('supervisor')}
                >
                  <Ionicons name="shield-checkmark" size={20} color={newUserRole === 'supervisor' ? '#fff' : '#4CAF50'} />
                  <Text style={[
                    styles.roleOptionText,
                    newUserRole === 'supervisor' && styles.roleOptionTextSelected
                  ]}>Supervisor</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>4-Digit PIN</Text>
              <TextInput
                style={styles.formInput}
                value={newUserPin}
                onChangeText={setNewUserPin}
                placeholder="1234"
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={4}
              />
              <Text style={styles.formHint}>Create a 4-digit PIN for this user</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeEditModal}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit User</Text>
            <TouchableOpacity onPress={handleEditUser}>
              <Ionicons name="checkmark" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Full Name</Text>
              <TextInput
                style={styles.formInput}
                value={newUserName}
                onChangeText={setNewUserName}
                placeholder="Enter full name"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Role</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity 
                  style={[
                    styles.roleOption,
                    newUserRole === 'engineer' && styles.roleOptionSelected
                  ]}
                  onPress={() => setNewUserRole('engineer')}
                >
                  <Ionicons name="construct" size={20} color={newUserRole === 'engineer' ? '#fff' : '#2196F3'} />
                  <Text style={[
                    styles.roleOptionText,
                    newUserRole === 'engineer' && styles.roleOptionTextSelected
                  ]}>Engineer</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.roleOption,
                    newUserRole === 'supervisor' && styles.roleOptionSelected
                  ]}
                  onPress={() => setNewUserRole('supervisor')}
                >
                  <Ionicons name="shield-checkmark" size={20} color={newUserRole === 'supervisor' ? '#fff' : '#4CAF50'} />
                  <Text style={[
                    styles.roleOptionText,
                    newUserRole === 'supervisor' && styles.roleOptionTextSelected
                  ]}>Supervisor</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>4-Digit PIN</Text>
              <TextInput
                style={styles.formInput}
                value={newUserPin}
                onChangeText={setNewUserPin}
                placeholder="1234"
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={4}
              />
              <Text style={styles.formHint}>Update the 4-digit PIN for this user</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  errorText: {
    color: '#F44336',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  errorSubtext: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  headerSection: {
    padding: 20,
    backgroundColor: '#2d2d2d',
    marginBottom: 20,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtext: {
    color: '#aaa',
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  usersSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  roleIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userRole: {
    color: '#aaa',
    fontSize: 14,
  },
  userMeta: {
    marginLeft: 44,
  },
  userPin: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  lastLogin: {
    color: '#666',
    fontSize: 12,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#404040',
    padding: 8,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#404040',
    padding: 8,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#2d2d2d',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  formHint: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d2d2d',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  roleOptionSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  roleOptionText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  roleOptionTextSelected: {
    color: '#fff',
  },
});
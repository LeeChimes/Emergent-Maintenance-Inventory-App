// frontend/app/ppms.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from './components/Screen';
import Container from './components/Container';
import UniversalHeader from './components/UniversalHeader';
import { AppErrorHandler } from './utils/AppErrorHandler';

const { width } = Dimensions.get('window');

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

interface PPM {
  id?: string;
  name: string;
  description: string;
  equipment: string;
  frequency: 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  next_due: string;
  assigned_to: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Active' | 'Due' | 'Overdue' | 'Completed';
  last_completed?: string;
  created_by: string;
  created_at?: string;
}

export default function PPMs() {
  // Read params when the universal scanner redirects here:
  // /ppms?scanned=1&t=door&id=FD-CORE8-012
  const params = useLocalSearchParams<{ scanned?: string; t?: string; id?: string }>();
  const [scanDoorId, setScanDoorId] = useState<string>('');

  const [user, setUser] = useState<User | null>(null);
  const [ppms, setPpms] = useState<PPM[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for creating new PPM
  const [newPpm, setNewPpm] = useState<PPM>({
    name: '',
    description: '',
    equipment: '',
    frequency: 'Monthly',
    next_due: '',
    assigned_to: '',
    priority: 'Medium',
    status: 'Active',
    created_by: '',
  });

  // capture scanned door id (if any)
  useEffect(() => {
    if (params.scanned === '1' && params.t === 'door' && params.id) {
      const doorId = String(params.id);
      setScanDoorId(doorId);
      // Optional: immediately filter to only this door
      // setSearchQuery(doorId);
    }
  }, [params.scanned, params.t, params.id]);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) fetchPPMs();
  }, [user]);

  const initializeUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setNewPpm((prev) => ({ ...prev, created_by: parsedUser.id }));
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchPPMs = async () => {
    try {
      // Mock PPMs until backend endpoints are available
      const mockPPMs: PPM[] = [
        {
          id: 'FD-CORE8-012', // matches a door-like ID so scanning highlights it
          name: 'Fire Door Check — Core 8 Door 012',
          description: 'Inspect hinges, seals, closure speed, and signage.',
          equipment: 'Fire Door — Core 8 — 012',
          frequency: 'Monthly',
          next_due: '2025-01-15',
          assigned_to: 'Lee Paull',
          priority: 'High',
          status: 'Due',
          last_completed: '2024-12-15',
          created_by: 'lee_carter',
          created_at: '2024-11-01',
        },
        {
          id: '1',
          name: 'HVAC Filter Replacement',
          description: 'Replace all HVAC filters in main shopping areas',
          equipment: 'HVAC System — Main Mall',
          frequency: 'Monthly',
          next_due: '2025-01-15',
          assigned_to: 'Lee Paull',
          priority: 'High',
          status: 'Due',
          last_completed: '2024-12-15',
          created_by: 'lee_carter',
          created_at: '2024-11-01',
        },
        {
          id: '2',
          name: 'Emergency Lighting Test',
          description: 'Test all emergency lighting systems throughout the centre',
          equipment: 'Emergency Lighting — All Areas',
          frequency: 'Weekly',
          next_due: '2025-01-08',
          assigned_to: 'Dean Turnill',
          priority: 'High',
          status: 'Active',
          last_completed: '2025-01-01',
          created_by: 'dan_carter',
          created_at: '2024-10-15',
        },
        {
          id: '3',
          name: 'Escalator Safety Inspection',
          description: 'Comprehensive safety check of all escalators',
          equipment: 'Escalators — Level 1 & 2',
          frequency: 'Quarterly',
          next_due: '2025-03-01',
          assigned_to: 'Luis',
          priority: 'Medium',
          status: 'Active',
          last_completed: '2024-12-01',
          created_by: 'lee_carter',
          created_at: '2024-09-01',
        },
        {
          id: '4',
          name: 'Fire Safety Equipment Check',
          description: 'Inspect fire extinguishers, hoses, and alarm systems',
          equipment: 'Fire Safety — All Locations',
          frequency: 'Monthly',
          next_due: '2024-12-28',
          assigned_to: 'Lee Paull',
          priority: 'High',
          status: 'Overdue',
          last_completed: '2024-11-28',
          created_by: 'dan_carter',
          created_at: '2024-08-15',
        },
      ];
      setPpms(mockPPMs);
    } catch (error) {
      console.error('Error fetching PPMs:', error);
      AppErrorHandler.handleError(error as Error, 'Failed to load PPMs');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPPMs();
    setRefreshing(false);
  };

  const handleCreatePPM = async () => {
    if (!newPpm.name || !newPpm.equipment || !newPpm.next_due || !newPpm.assigned_to) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      // In a real implementation, this would make an API call
      const newPpmWithId: PPM = {
        ...newPpm,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
      };

      setPpms((prev) => [newPpmWithId, ...prev]);
      setShowCreateModal(false);
      setNewPpm({
        name: '',
        description: '',
        equipment: '',
        frequency: 'Monthly',
        next_due: '',
        assigned_to: '',
        priority: 'Medium',
        status: 'Active',
        created_by: user?.id || '',
      });

      Alert.alert('Success', 'PPM created successfully!');
    } catch (error) {
      console.error('Error creating PPM:', error);
      AppErrorHandler.handleError(error as Error, 'Failed to create PPM');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return '#4CAF50';
      case 'Due':
        return '#FF9800';
      case 'Overdue':
        return '#F44336';
      case 'Completed':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return '#F44336';
      case 'Medium':
        return '#FF9800';
      case 'Low':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'Weekly':
        return 'calendar';
      case 'Monthly':
        return 'calendar-outline';
      case 'Quarterly':
        return 'calendar-sharp';
      case 'Yearly':
        return 'calendar-clear';
      default:
        return 'calendar';
    }
  };

  const filteredPPMs = ppms.filter((ppm) => {
    const matchesFilter = selectedFilter === 'All' || ppm.status === selectedFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      ppm.name.toLowerCase().includes(q) ||
      ppm.equipment.toLowerCase().includes(q) ||
      ppm.assigned_to.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const renderCreateModal = () => (
    <Modal visible={showCreateModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.createModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New PPM</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PPM Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newPpm.name}
                onChangeText={(text) => setNewPpm((prev) => ({ ...prev, name: text }))}
                placeholder="e.g., HVAC Filter Replacement"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Equipment/Location *</Text>
              <TextInput
                style={styles.textInput}
                value={newPpm.equipment}
                onChangeText={(text) => setNewPpm((prev) => ({ ...prev, equipment: text }))}
                placeholder="e.g., HVAC System — Main Mall"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newPpm.description}
                onChangeText={(text) => setNewPpm((prev) => ({ ...prev, description: text }))}
                placeholder="Detailed description of the maintenance task"
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Frequency</Text>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerText}>{newPpm.frequency}</Text>
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.pickerContainer}>
                  <Text style={[styles.pickerText, { color: getPriorityColor(newPpm.priority) }]}>
                    {newPpm.priority}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Next Due Date *</Text>
              <TextInput
                style={styles.textInput}
                value={newPpm.next_due}
                onChangeText={(text) => setNewPpm((prev) => ({ ...prev, next_due: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Assigned To *</Text>
              <TextInput
                style={styles.textInput}
                value={newPpm.assigned_to}
                onChangeText={(text) => setNewPpm((prev) => ({ ...prev, assigned_to: text }))}
                placeholder="Team member name"
                placeholderTextColor="#666"
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalButton, styles.createButton]} onPress={handleCreatePPM}>
              <Text style={styles.modalButtonText}>Create PPM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <Screen scroll>
        <Container>
          <UniversalHeader title="PPMs" showBackButton />
          <View style={styles.centerContent}>
            <Ionicons name="calendar" size={48} color="#4CAF50" />
            <Text style={styles.loadingText}>Loading maintenance schedules...</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Container>
        <UniversalHeader title="PPMs" showBackButton />

        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerLeft}>
            <Ionicons name="calendar" size={28} color="#4CAF50" />
            <View>
              <Text style={styles.headerTitle}>Planned Preventive Maintenance</Text>
              <Text style={styles.headerSubtitle}>{filteredPPMs.length} scheduled tasks</Text>
            </View>
          </View>

          {user?.role === 'supervisor' && (
            <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.statNumber}>{ppms.filter((p) => p.status === 'Active').length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={20} color="#FF9800" />
            <Text style={styles.statNumber}>{ppms.filter((p) => p.status === 'Due').length}</Text>
            <Text style={styles.statLabel}>Due</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="warning" size={20} color="#F44336" />
            <Text style={styles.statNumber}>{ppms.filter((p) => p.status === 'Overdue').length}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search PPMs..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
            <Ionicons name="filter" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* PPMs List */}
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredPPMs.map((ppm) => (
            <View
              key={ppm.id}
              style={[
                styles.ppmCard,
                // highlight if the scanned id matches this record
                scanDoorId &&
                (ppm?.id === scanDoorId ||
                  (ppm?.equipment && ppm.equipment.includes(scanDoorId)))
                  ? { borderWidth: 2, borderColor: '#4CAF50' }
                  : null,
              ]}
            >
              <View style={styles.ppmHeader}>
                <View style={styles.ppmTitleSection}>
                  <Text style={styles.ppmName}>{ppm.name}</Text>
                  <Text style={styles.ppmEquipment}>{ppm.equipment}</Text>
                </View>

                <View style={styles.ppmStatusSection}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ppm.status) }]}>
                    <Text style={styles.statusText}>{ppm.status}</Text>
                  </View>
                  <View style={[styles.priorityBadge, { borderColor: getPriorityColor(ppm.priority) }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(ppm.priority) }]}>{ppm.priority}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.ppmDescription}>{ppm.description}</Text>

              <View style={styles.ppmDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name={getFrequencyIcon(ppm.frequency)} size={16} color="#666" />
                  <Text style={styles.detailText}>{ppm.frequency}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>Due: {ppm.next_due}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Ionicons name="person" size={16} color="#666" />
                  <Text style={styles.detailText}>{ppm.assigned_to}</Text>
                </View>
              </View>

              <View style={styles.ppmActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => Alert.alert('PPM', 'Open PPM details (route TBD)')}
                >
                  <Ionicons name="eye" size={18} color="#2196F3" />
                  <Text style={[styles.actionText, { color: '#2196F3' }]}>View</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => Alert.alert('Complete', 'Completion flow not implemented yet')}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                  <Text style={[styles.actionText, { color: '#4CAF50' }]}>Complete</Text>
                </TouchableOpacity>

                {user?.role === 'supervisor' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Alert.alert('Edit', 'Edit flow not implemented yet')}
                  >
                    <Ionicons name="create" size={18} color="#FF9800" />
                    <Text style={[styles.actionText, { color: '#FF9800' }]}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {filteredPPMs.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#666" />
              <Text style={styles.emptyTitle}>No PPMs Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first PPM schedule'}
              </Text>
            </View>
          )}
        </ScrollView>

        {renderCreateModal()}

        {/* Filter Modal */}
        <Modal visible={showFilterModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.filterModal}>
              <Text style={styles.filterTitle}>Filter PPMs</Text>

              {['All', 'Active', 'Due', 'Overdue', 'Completed'].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterOption,
                    selectedFilter === filter && styles.selectedFilterOption,
                  ]}
                  onPress={() => {
                    setSelectedFilter(filter);
                    setShowFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedFilter === filter && styles.selectedFilterOptionText,
                    ]}
                  >
                    {filter}
                  </Text>
                  {selectedFilter === filter && (
                    <Ionicons name="checkmark" size={20} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
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
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#aaa',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  filterButton: {
    backgroundColor: '#4CAF50',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  ppmCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  ppmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ppmTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  ppmName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ppmEquipment: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  ppmStatusSection: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ppmDescription: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  ppmDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    color: '#aaa',
    fontSize: 12,
  },
  ppmActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#404040',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createModal: {
    backgroundColor: '#2d2d2d',
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#3d3d3d',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
  },
  pickerContainer: {
    backgroundColor: '#3d3d3d',
    borderRadius: 12,
    padding: 16,
  },
  pickerText: {
    color: '#fff',
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterModal: {
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    padding: 20,
    minWidth: 200,
  },
  filterTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedFilterOption: {
    backgroundColor: '#4CAF50',
  },
  filterOptionText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedFilterOptionText: {
    fontWeight: 'bold',
  },
});

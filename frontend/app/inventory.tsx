import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

interface Material {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  min_stock: number;
  location?: string;
  supplier?: {
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
  };
  photo?: string;
  created_at: string;
  updated_at: string;
}

interface Tool {
  id: string;
  name: string;
  description?: string;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_order';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  location?: string;
  current_user?: string;
  service_records?: any[];
  next_service_due?: string;
  photo?: string;
  created_at: string;
  updated_at: string;
}

type InventoryItem = Material | Tool;

export default function Inventory() {
  const [user, setUser] = useState<User | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [activeTab, setActiveTab] = useState<'materials' | 'tools'>('materials');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchInventoryData();
    }
  }, [user, activeTab]);

  const initializeUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.replace('/');
    }
  };

  const fetchInventoryData = async () => {
    try {
      if (activeTab === 'materials') {
        const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/materials`);
        if (response.ok) {
          const data = await response.json();
          setMaterials(data);
        }
      } else {
        const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/tools`);
        if (response.ok) {
          const data = await response.json();
          setTools(data);
        }
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      Alert.alert('Error', 'Could not load inventory data. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInventoryData();
  };

  const filterItems = (items: InventoryItem[]) => {
    if (!searchQuery) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };

  const isMaterial = (item: InventoryItem): item is Material => {
    return 'quantity' in item;
  };

  const isLowStock = (material: Material): boolean => {
    return material.quantity <= material.min_stock;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#4CAF50';
      case 'in_use': return '#FF9800';
      case 'maintenance': return '#F44336';
      case 'out_of_order': return '#9E9E9E';
      default: return '#666';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'fair': return '#FF9800';
      case 'poor': return '#F44336';
      default: return '#666';
    }
  };

  const renderMaterialItem = ({ item }: { item: Material }) => (
    <TouchableOpacity
      style={[
        styles.itemCard,
        isLowStock(item) && styles.lowStockCard
      ]}
      onPress={() => {
        setSelectedItem(item);
        setShowItemModal(true);
      }}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemIcon}>
          <Ionicons name="cube" size={24} color="#4CAF50" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.itemDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        {isLowStock(item) && (
          <Ionicons name="warning" size={20} color="#FF9800" />
        )}
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Stock:</Text>
          <Text style={[
            styles.detailValue,
            isLowStock(item) && styles.lowStockText
          ]}>
            {item.quantity} {item.unit}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Min Stock:</Text>
          <Text style={styles.detailValue}>{item.min_stock} {item.unit}</Text>
        </View>
        {item.location && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{item.location}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderToolItem = ({ item }: { item: Tool }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => {
        setSelectedItem(item);
        setShowItemModal(true);
      }}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemIcon}>
          <Ionicons name="build" size={24} color="#2196F3" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.itemDescription} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) }
        ]}>
          <Text style={styles.statusText}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Condition:</Text>
          <Text style={[
            styles.detailValue,
            { color: getConditionColor(item.condition) }
          ]}>
            {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
          </Text>
        </View>
        {item.current_user && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Used by:</Text>
            <Text style={styles.detailValue}>{item.current_user}</Text>
          </View>
        )}
        {item.location && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{item.location}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderItemModal = () => {
    if (!selectedItem) return null;

    const item = selectedItem;
    const itemType = isMaterial(item) ? 'material' : 'tool';

    return (
      <Modal
        visible={showItemModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowItemModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Item Details</Text>
            <TouchableOpacity
              onPress={() => {
                setShowItemModal(false);
                router.push('/scanner');
              }}
            >
              <Ionicons name="qr-code" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.itemDetailCard}>
              <View style={styles.itemDetailHeader}>
                <Ionicons 
                  name={itemType === 'material' ? 'cube' : 'build'} 
                  size={32} 
                  color={itemType === 'material' ? '#4CAF50' : '#2196F3'} 
                />
                <View style={styles.itemDetailInfo}>
                  <Text style={styles.itemDetailName}>{item.name}</Text>
                  <Text style={styles.itemDetailType}>
                    {itemType === 'material' ? 'Material' : 'Tool'}
                  </Text>
                </View>
              </View>

              {item.description && (
                <Text style={styles.itemDetailDescription}>{item.description}</Text>
              )}

              <View style={styles.itemDetailSection}>
                {itemType === 'material' ? (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Current Stock:</Text>
                      <Text style={[
                        styles.detailValue,
                        isLowStock(item as Material) && styles.lowStockText
                      ]}>
                        {(item as Material).quantity} {(item as Material).unit}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Minimum Stock:</Text>
                      <Text style={styles.detailValue}>
                        {(item as Material).min_stock} {(item as Material).unit}
                      </Text>
                    </View>
                    {(item as Material).supplier && (
                      <View style={styles.supplierSection}>
                        <Text style={styles.sectionTitle}>Supplier Information</Text>
                        <Text style={styles.supplierName}>
                          {(item as Material).supplier!.name}
                        </Text>
                        {(item as Material).supplier!.contact_person && (
                          <Text style={styles.supplierDetail}>
                            Contact: {(item as Material).supplier!.contact_person}
                          </Text>
                        )}
                        {(item as Material).supplier!.phone && (
                          <Text style={styles.supplierDetail}>
                            Phone: {(item as Material).supplier!.phone}
                          </Text>
                        )}
                        {(item as Material).supplier!.email && (
                          <Text style={styles.supplierDetail}>
                            Email: {(item as Material).supplier!.email}
                          </Text>
                        )}
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status:</Text>
                      <Text style={[
                        styles.detailValue,
                        { color: getStatusColor((item as Tool).status) }
                      ]}>
                        {(item as Tool).status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Condition:</Text>
                      <Text style={[
                        styles.detailValue,
                        { color: getConditionColor((item as Tool).condition) }
                      ]}>
                        {(item as Tool).condition.charAt(0).toUpperCase() + 
                         (item as Tool).condition.slice(1)}
                      </Text>
                    </View>
                    {(item as Tool).current_user && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Current User:</Text>
                        <Text style={styles.detailValue}>{(item as Tool).current_user}</Text>
                      </View>
                    )}
                    {(item as Tool).next_service_due && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Next Service:</Text>
                        <Text style={styles.detailValue}>
                          {new Date((item as Tool).next_service_due!).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {item.location && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>{item.location}</Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Updated:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(item.updated_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => {
                  setShowItemModal(false);
                  router.push('/scanner');
                }}
              >
                <Ionicons name="qr-code" size={24} color="#fff" />
                <Text style={styles.scanButtonText}>Scan to Update</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const currentItems = activeTab === 'materials' ? materials : tools;
  const filteredItems = filterItems(currentItems);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/scanner')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="qr-code" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'materials' && styles.activeTab
          ]}
          onPress={() => setActiveTab('materials')}
        >
          <Ionicons 
            name="cube" 
            size={20} 
            color={activeTab === 'materials' ? '#fff' : '#666'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'materials' && styles.activeTabText
          ]}>
            Materials ({materials.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'tools' && styles.activeTab
          ]}
          onPress={() => setActiveTab('tools')}
        >
          <Ionicons 
            name="build" 
            size={20} 
            color={activeTab === 'tools' ? '#fff' : '#666'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'tools' && styles.activeTabText
          ]}>
            Tools ({tools.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inventory List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading inventory...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.centerContent}>
            <Ionicons 
              name={activeTab === 'materials' ? 'cube-outline' : 'build-outline'} 
              size={64} 
              color="#666" 
            />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No items match your search' : `No ${activeTab} found`}
            </Text>
            {!searchQuery && user?.role === 'supervisor' && (
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>Add First Item</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlashList
            data={filteredItems}
            renderItem={activeTab === 'materials' ? renderMaterialItem : renderToolItem}
            estimatedItemSize={120}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#4CAF50"
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {renderItemModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    margin: 20,
    marginBottom: 0,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  lowStockCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3d3d3d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDescription: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  detailValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  lowStockText: {
    color: '#FF9800',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
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
  itemDetailCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 20,
  },
  itemDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  itemDetailInfo: {
    flex: 1,
  },
  itemDetailName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  itemDetailType: {
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 4,
  },
  itemDetailDescription: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  itemDetailSection: {
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  supplierSection: {
    backgroundColor: '#3d3d3d',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  supplierName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  supplierDetail: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
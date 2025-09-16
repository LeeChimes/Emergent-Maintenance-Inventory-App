// frontend/app/inventory.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import Screen from './components/Screen';
import Container from './components/Container';
import UniversalHeader from './components/UniversalHeader';
import { AppErrorHandler } from '../utils/AppErrorHandler';

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

interface InventoryItem {
  id: string;       // e.g., "ASSET-123"
  name: string;     // e.g., "Cordless Drill"
  sku: string;      // e.g., "DRL-001"
  quantity: number; // stock count
  location: string; // e.g., "Workshop"
}

export default function Inventory() {
  // from /scan redirect: /inventory?scanned=1&t=asset&id=ASSET-123
  const params = useLocalSearchParams<{ scanned?: string; t?: string; id?: string }>();
  const [scanFilter, setScanFilter] = useState<string>('');

  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (params.scanned === '1' && params.id) {
      setScanFilter(String(params.id));
    }
  }, [params.scanned, params.id]);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (user) fetchItems();
  }, [user]);

  const initializeUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
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

  const fetchItems = async () => {
    try {
      // mock data for now
      const mock: InventoryItem[] = [
        { id: 'ASSET-123', name: 'Cordless Drill', sku: 'DRL-001', quantity: 2, location: 'Workshop' },
        { id: 'ASSET-456', name: 'Hammer', sku: 'HAM-001', quantity: 5, location: 'Workshop' },
        { id: 'ASSET-789', name: 'Fire Extinguisher', sku: 'FEX-002', quantity: 12, location: 'Basement' },
      ];
      setItems(mock);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      AppErrorHandler.handleError(error as Error, 'Failed to load inventory');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const filteredItems = items.filter((x) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      x.name.toLowerCase().includes(q) ||
      x.sku.toLowerCase().includes(q) ||
      x.location.toLowerCase().includes(q);

    const matchesScan =
      !scanFilter ||
      x.id.includes(scanFilter) ||
      x.sku.includes(scanFilter) ||
      x.name.toLowerCase().includes(scanFilter.toLowerCase());

    return matchesSearch && matchesScan;
  });

  if (loading) {
    return (
      <Screen scroll>
        <Container>
          <UniversalHeader title="Inventory" showBackButton />
          <View style={styles.centerContent}>
            <Ionicons name="cube" size={48} color="#4CAF50" />
            <Text style={styles.loadingText}>Loading inventory...</Text>
          </View>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Container>
        <UniversalHeader title="Inventory" showBackButton />

        {/* Search bar */}
        <View style={styles.searchSection}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search inventory..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Inventory list */}
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredItems.map((item) => (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                scanFilter &&
                (item.id === scanFilter ||
                  item.sku.includes(scanFilter) ||
                  item.name.toLowerCase().includes(scanFilter.toLowerCase()))
                  ? { borderWidth: 2, borderColor: '#4CAF50' }
                  : null,
              ]}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSku}>SKU: {item.sku}</Text>
              </View>

              <Text style={styles.itemDetail}>Location: {item.location}</Text>
              <Text style={styles.itemDetail}>Qty: {item.quantity}</Text>

              <View style={styles.itemActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => Alert.alert('View Item', `Viewing ${item.name}`)}
                >
                  <Ionicons name="eye" size={18} color="#2196F3" />
                  <Text style={[styles.actionText, { color: '#2196F3' }]}>View</Text>
                </TouchableOpacity>

                {user?.role === 'supervisor' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Alert.alert('Edit Item', 'Edit flow not implemented yet')}
                  >
                    <Ionicons name="create" size={18} color="#FF9800" />
                    <Text style={[styles.actionText, { color: '#FF9800' }]}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {filteredItems.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color="#666" />
              <Text style={styles.emptyTitle}>No Items Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try adjusting your search criteria' : 'No inventory records available.'}
              </Text>
            </View>
          )}
        </ScrollView>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    paddingHorizontal: 16,
    margin: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  itemHeader: {
    marginBottom: 8,
  },
  itemName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemSku: {
    color: '#aaa',
    fontSize: 14,
  },
  itemDetail: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 4,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#404040',
    paddingTop: 12,
    marginTop: 8,
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
});

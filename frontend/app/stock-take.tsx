import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UniversalHeader from './components/UniversalHeader';
import Screen from './components/Screen';
import Container from './components/Container';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

interface StockItem {
  id: string;
  name: string;
  type: 'material' | 'tool';
  current_quantity: number;
  unit: string;
  location?: string;
  category?: string;
  qr_code?: string;
}

interface StockCount {
  item_id: string;
  item_name: string;
  counted_quantity: number;
  expected_quantity: number;
  variance: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}

export default function StockTake() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<StockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([]);
  const [stockCounts, setStockCounts] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualItemId, setManualItemId] = useState('');

  const categories = ['all', 'tools', 'materials', 'safety', 'electrical', 'plumbing'];

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory]);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      router.push('/');
    }
  };

  const fetchItems = async () => {
    try {
      const [materialsResponse, toolsResponse] = await Promise.all([
        fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/materials`),
        fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/tools`)
      ]);

      let allItems: StockItem[] = [];

      if (materialsResponse.ok) {
        const materials = await materialsResponse.json();
        allItems = [...allItems, ...materials.map((item: any) => ({ ...item, type: 'material' }))];
      }

      if (toolsResponse.ok) {
        const tools = await toolsResponse.json();
        allItems = [...allItems, ...tools.map((item: any) => ({ ...item, type: 'tool' }))];
      }

      setItems(allItems);
    } catch (error) {
      console.error('Error fetching items:', error);
      Alert.alert('Error', 'Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => {
        if (selectedCategory === 'tools') return item.type === 'tool';
        if (selectedCategory === 'materials') return item.type === 'material';
        return item.category?.toLowerCase() === selectedCategory;
      });
    }

    setFilteredItems(filtered);
  };

  const handleManualEntry = () => {
    if (!manualItemId.trim()) {
      Alert.alert('Input Required', 'Please enter an item ID or QR code');
      return;
    }

    const item = items.find(i => 
      i.id.toLowerCase() === manualItemId.toLowerCase() ||
      i.qr_code?.toLowerCase() === manualItemId.toLowerCase()
    );

    if (item) {
      startStockCount(item);
      setShowManualEntry(false);
      setManualItemId('');
    } else {
      Alert.alert('Item Not Found', 'No item found with that ID or QR code');
    }
  };

  const startStockCount = (item: StockItem) => {
    Alert.prompt(
      'Stock Count',
      `Count items for: ${item.name}\n\nCurrent expected: ${item.current_quantity} ${item.unit}`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Count',
          onPress: (countedValue?: string) => {
            if (countedValue && !isNaN(Number(countedValue))) {
              const counted = Number(countedValue);
              const variance = counted - item.current_quantity;
              
              Alert.alert(
                'Condition Check',
                `You counted ${counted} ${item.unit}${variance !== 0 ? `\nVariance: ${variance > 0 ? '+' : ''}${variance}` : '\nNo variance - perfect!'}`,
                [
                  {
                    text: 'Excellent',
                    onPress: () => recordStockCount(item, counted, 'excellent')
                  },
                  {
                    text: 'Good',
                    onPress: () => recordStockCount(item, counted, 'good')
                  },
                  {
                    text: 'Fair',
                    onPress: () => recordStockCount(item, counted, 'fair')
                  },
                  {
                    text: 'Poor',
                    onPress: () => recordStockCount(item, counted, 'poor')
                  }
                ]
              );
            } else {
              Alert.alert('Invalid Input', 'Please enter a valid number');
            }
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const recordStockCount = (item: StockItem, countedQuantity: number, condition: 'excellent' | 'good' | 'fair' | 'poor') => {
    const variance = countedQuantity - item.current_quantity;
    
    const stockCount: StockCount = {
      item_id: item.id,
      item_name: item.name,
      counted_quantity: countedQuantity,
      expected_quantity: item.current_quantity,
      variance,
      condition
    };

    setStockCounts(prev => {
      const existingIndex = prev.findIndex(sc => sc.item_id === item.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = stockCount;
        return updated;
      } else {
        return [...prev, stockCount];
      }
    });

    const varianceText = variance === 0 ? 
      'Perfect count! 🎯' : 
      variance > 0 ? 
        `Found ${variance} extra items! 📈` : 
        `Missing ${Math.abs(variance)} items! 📉`;

    Alert.alert(
      'Count Recorded! ✅',
      `${item.name}: ${countedQuantity} ${item.unit}\n${varianceText}`,
      [{ text: 'Great!' }]
    );
  };

  const finishStockTake = () => {
    if (stockCounts.length === 0) {
      Alert.alert('No Counts', 'Please count at least one item before finishing');
      return;
    }

    Alert.alert(
      'Finish Stock Take',
      `You've counted ${stockCounts.length} items. Do you want to submit this stock take?`,
      [
        { text: 'Continue Counting', style: 'cancel' },
        {
          text: 'Submit Stock Take',
          onPress: async () => {
            try {
              const stockTakeData = {
                user_id: user?.id,
                user_name: user?.name,
                timestamp: new Date().toISOString(),
                counts: stockCounts
              };

              const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/stock-takes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stockTakeData)
              });

              if (response.ok) {
                Alert.alert(
                  'Stock Take Complete! 🎉',
                  `Successfully submitted count for ${stockCounts.length} items. Great work!`,
                  [{ 
                    text: 'Done', 
                    onPress: () => {
                      setStockCounts([]);
                      router.push('/');
                    }
                  }]
                );
              } else {
                throw new Error('Failed to submit stock take');
              }
            } catch (error) {
              console.error('Error submitting stock take:', error);
              Alert.alert('Error', 'Failed to submit stock take. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Screen scroll>
      <Container>
        {/* Universal Header */}
        <UniversalHeader title="Stock Take" showBackButton={true} />

        {/* Content - now handled by Screen scroll */}
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>📊 Stock Take</Text>
          <Text style={styles.welcomeText}>
            Count inventory items to keep accurate stock levels. 
            Scan QR codes or search for items to count.
          </Text>
          {stockCounts.length > 0 && (
            <View style={styles.progressContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.progressText}>
                {stockCounts.length} items counted so far
              </Text>
            </View>
          )}
        </View>

        {/* Search and Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search items..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive
                ]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.manualEntryButton}
            onPress={() => setShowManualEntry(true)}
          >
            <Ionicons name="keypad" size={20} color="#FF9800" />
            <Text style={styles.manualEntryText}>Manual Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Items List */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>
            Available Items ({filteredItems.length})
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading items...</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#666" />
              <Text style={styles.emptyStateText}>No items found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your search or filter
              </Text>
            </View>
          ) : (
            filteredItems.map(item => {
              const counted = stockCounts.find(sc => sc.item_id === item.id);
              
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, counted && styles.itemCardCounted]}
                  onPress={() => startStockCount(item)}
                >
                  <View style={styles.itemHeader}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemType}>
                        {item.type} • Expected: {item.current_quantity} {item.unit}
                      </Text>
                      {item.location && (
                        <Text style={styles.itemLocation}>📍 {item.location}</Text>
                      )}
                    </View>
                    
                    {counted ? (
                      <View style={styles.countedBadge}>
                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                        <Text style={styles.countedText}>
                          {counted.counted_quantity}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.countButton}>
                        <Ionicons name="add-circle" size={24} color="#2196F3" />
                        <Text style={styles.countButtonText}>Count</Text>
                      </View>
                    )}
                  </View>

                  {counted && (
                    <View style={styles.countDetails}>
                      <Text style={styles.countSummary}>
                        Counted: {counted.counted_quantity} • Variance: {counted.variance > 0 ? '+' : ''}{counted.variance}
                      </Text>
                      <Text style={styles.countCondition}>
                        Condition: {counted.condition}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
        {/* ScrollView content ends here */}

      {/* Floating Finish Button */}
      {stockCounts.length > 0 && (
        <TouchableOpacity
          style={styles.finishButton}
          onPress={finishStockTake}
        >
          <Ionicons name="checkmark" size={24} color="#fff" />
          <Text style={styles.finishButtonText}>
            Finish ({stockCounts.length})
          </Text>
        </TouchableOpacity>
      )}

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualEntry}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowManualEntry(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowManualEntry(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Manual Entry</Text>
            <TouchableOpacity onPress={handleManualEntry}>
              <Ionicons name="checkmark" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalDescription}>
              Enter the item ID or scan a QR code to start counting
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item ID or QR Code</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter item ID..."
                value={manualItemId}
                onChangeText={setManualItemId}
                autoFocus
                onSubmitEditing={handleManualEntry}
              />
            </View>
          </View>
        </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  welcomeSection: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 12,
    marginVertical: 16,
  },
  welcomeTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeText: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 22,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#1B5E20',
    borderRadius: 8,
  },
  progressText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  categoryFilter: {
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: '#404040',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#2196F3',
  },
  categoryChipText: {
    color: '#ccc',
    fontSize: 14,
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#404040',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  manualEntryText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  itemsSection: {
    marginBottom: 100,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  itemCard: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  itemCardCounted: {
    borderColor: '#4CAF50',
    backgroundColor: '#1B5E20',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemType: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  itemLocation: {
    color: '#999',
    fontSize: 12,
  },
  countButton: {
    alignItems: 'center',
  },
  countButtonText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  countedBadge: {
    alignItems: 'center',
  },
  countedText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  countDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  countSummary: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  countCondition: {
    color: '#999',
    fontSize: 12,
  },
  finishButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    padding: 20,
  },
  modalDescription: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#2d2d2d',
    borderWidth: 1,
    borderColor: '#404040',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
});
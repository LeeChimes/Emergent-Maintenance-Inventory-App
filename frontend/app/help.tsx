import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function Help() {
  const helpCategories = [
    {
      id: 'dashboard',
      title: '🏠 Dashboard & Navigation',
      description: 'Learn how to use the main screens and navigate the app',
      items: ['Dashboard overview', 'Button functions', 'Navigation basics']
    },
    {
      id: 'inventory',
      title: '📦 Inventory Management', 
      description: 'Managing materials and tools in the system',
      items: ['Add new items', 'Edit existing items', 'Generate QR codes', 'Stock counting']
    },
    {
      id: 'deliveries',
      title: '🚚 Deliveries',
      description: 'How to log and track deliveries',
      items: ['Manual entry', 'Select suppliers', 'Track deliveries', 'Update status']
    },
    {
      id: 'suppliers',
      title: '👥 Suppliers',
      description: 'Managing supplier information and products',
      items: ['Add suppliers', 'Edit details', 'View products', 'Contact info']
    },
    {
      id: 'scanner',
      title: '📱 QR Scanner',
      description: 'Using the QR code scanner and troubleshooting',
      items: ['How to scan', 'Manual entry', 'Camera issues', 'QR code problems']
    },
    {
      id: 'troubleshooting',
      title: '❗ Troubleshooting',
      description: 'Common issues and solutions',
      items: ['App not loading', 'Scanner problems', 'Login issues', 'Data sync']
    }
  ];

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.push('/')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="home" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to Help & Support! 👋</Text>
          <Text style={styles.welcomeText}>
            Find step-by-step instructions for any part of the app. If you can't find what you're looking for, 
            you can contact your supervisors for additional help.
          </Text>
        </View>

        {/* Help Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>📚 Help Categories</Text>
          
          {helpCategories.map(category => (
            <TouchableOpacity 
              key={category.id} 
              style={styles.categoryCard}
              onPress={() => {
                // Navigate to detailed help screens
                if (category.id === 'dashboard') {
                  router.push('/dashboard-help');
                } else if (category.id === 'deliveries') {
                  router.push('/deliveries-help');
                } else {
                  // Other categories coming in next steps
                  alert(`Coming in Step 3: ${category.title} help section`);
                }
              }}
            >
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </View>
              <Text style={styles.categoryDescription}>{category.description}</Text>
              <View style={styles.categoryItems}>
                {category.items.slice(0, 3).map((item, index) => (
                  <Text key={index} style={styles.categoryItem}>• {item}</Text>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/ai-help')}
          >
            <Ionicons name="sparkles" size={24} color="#4CAF50" />
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>🤖 AI Help Assistant</Text>
              <Text style={styles.quickActionDescription}>Ask any question about the app</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="mail" size={24} color="#FF9800" />
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>📨 Contact Supervisors</Text>
              <Text style={styles.quickActionDescription}>Coming in Step 4: Send help request</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 12,
  },
  categoryItems: {
    gap: 4,
  },
  categoryItem: {
    color: '#999',
    fontSize: 13,
  },
  quickActionsSection: {
    marginBottom: 32,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  quickActionContent: {
    marginLeft: 12,
    flex: 1,
  },
  quickActionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quickActionDescription: {
    color: '#999',
    fontSize: 14,
  },
});
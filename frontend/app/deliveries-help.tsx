import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function DeliveriesHelp() {
  const helpSections = [
    {
      title: "🚚 What are Deliveries?",
      steps: [
        "Deliveries are when suppliers bring materials or tools to your site",
        "You need to log each delivery so the system knows what arrived",
        "This helps track inventory and keep records up to date",
        "ALL team members (engineers and supervisors) can log deliveries"
      ]
    },
    {
      title: "📦 How to Log a New Delivery",
      steps: [
        "From main dashboard, tap the purple 'Log Delivery' button",
        "You'll see a list of recent deliveries at the top",
        "Tap the '+' button (bottom right) to add a new delivery",
        "Select the supplier from the horizontal list (tap their name)",
        "Tap 'Manual Entry' to enter delivery details"
      ]
    },
    {
      title: "✍️ Manual Entry Process",
      steps: [
        "Fill in the Delivery Number (from the delivery note)",
        "Enter Driver Name (who delivered it)",
        "Add Tracking Number if available",
        "Write any Notes about the delivery",
        "Tap 'Add Item' to list what was delivered",
        "For each item: enter name, quantity, unit (pieces, kg, etc.)",
        "Tap the green checkmark ✓ when finished"
      ]
    },
    {
      title: "🏢 Selecting Suppliers",
      steps: [
        "Suppliers appear as colored chips (buttons) you can scroll through",
        "Tap a supplier name to select it (it will turn green)",
        "You must select a supplier before entering delivery details",
        "If you don't see your supplier, ask a supervisor to add them",
        "Common suppliers: Screwfix, Toolstation, B&Q, etc."
      ]
    },
    {
      title: "📋 Viewing Existing Deliveries",
      steps: [
        "The main deliveries screen shows recent deliveries",
        "Each delivery shows: supplier, date, status",
        "Tap any delivery to see full details",
        "You can see items delivered, quantities, and notes",
        "Use the back arrow to return to the list"
      ]
    },
    {
      title: "❗ Common Issues & Solutions",
      steps: [
        "Can't see Log Delivery button? Check you're on the main dashboard",
        "Supplier not available? Ask supervisor to add them in Settings",
        "App crashes when adding items? Try adding one item at a time",
        "Delivery not saving? Make sure supplier is selected first"
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/help')}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deliveries Help</Text>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Ionicons name="home" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Introduction */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>🚚 Deliveries Help</Text>
          <Text style={styles.introText}>
            Learn how to log deliveries when suppliers bring materials and tools to site. 
            This keeps our inventory accurate and helps track what we receive.
          </Text>
        </View>

        {/* Help Sections */}
        {helpSections.map((section, index) => (
          <View key={index} style={styles.helpSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.steps.map((step, stepIndex) => (
              <View key={stepIndex} style={styles.stepContainer}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{stepIndex + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/deliveries')}
          >
            <Ionicons name="cube" size={24} color="#9C27B0" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Go to Deliveries</Text>
              <Text style={styles.actionDescription}>Try logging a delivery now</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/help')}
          >
            <Ionicons name="help-circle" size={24} color="#2196F3" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Back to Help Menu</Text>
              <Text style={styles.actionDescription}>See other help categories</Text>
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
  introSection: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    borderRadius: 12,
    marginVertical: 16,
  },
  introTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  introText: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 22,
  },
  helpSection: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#404040',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    backgroundColor: '#9C27B0',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  quickActionsSection: {
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  actionContent: {
    marginLeft: 12,
    flex: 1,
  },
  actionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionDescription: {
    color: '#999',
    fontSize: 14,
  },
});
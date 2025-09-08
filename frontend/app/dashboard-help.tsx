import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import UniversalHeader from '../components/UniversalHeader';

export default function DashboardHelp() {
  const helpSections = [
    {
      title: "🏠 Main Dashboard Overview",
      steps: [
        "When you login, you'll see the main dashboard",
        "Your name and role appear at the top",
        "Action buttons are displayed as large colored tiles",
        "Each button has an icon and description to help you"
      ]
    },
    {
      title: "🔘 Understanding the Buttons",
      steps: [
        "📱 QR Scanner - Scan item QR codes or enter manually",
        "📊 Inventory - View all materials and tools",
        "📦 Log Delivery - Record new deliveries (ALL users can access)",
        "💡 Help & Support - Get help (you're here now!)",
        "⚙️ Settings - App configuration (supervisors only)"
      ]
    },
    {
      title: "👆 How to Navigate",
      steps: [
        "Tap any button to go to that screen",
        "Use the back arrow (←) to return to previous screen",
        "Tap the home icon to return to main dashboard",
        "Pull down on lists to refresh data"
      ]
    },
    {
      title: "👤 User Roles Explained",
      steps: [
        "Engineers: Can scan items, view inventory, log deliveries",
        "Supervisors: Have all engineer access PLUS settings and reports",
        "Your role determines which buttons you can see",
        "If you can't see a button, check with your supervisor"
      ]
    },
    {
      title: "🆘 Quick Tips for Navigation",
      steps: [
        "Lost? Look for the back arrow (←) at the top left",
        "Need help anywhere? Tap this Help button from dashboard",
        "App frozen? Close and reopen the app",
        "Still stuck? Use 'Contact Supervisors' from main help screen"
      ]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.push('/help')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard & Navigation</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.push('/')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="home" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Introduction */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>🏠 Dashboard & Navigation Help</Text>
          <Text style={styles.introText}>
            Learn how to navigate around the app and understand what each button does. 
            This guide will help you move around confidently.
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
            onPress={() => router.push('/')}
          >
            <Ionicons name="home" size={24} color="#4CAF50" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Go to Dashboard</Text>
              <Text style={styles.actionDescription}>Return to main screen</Text>
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
  headerButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#4CAF50',
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
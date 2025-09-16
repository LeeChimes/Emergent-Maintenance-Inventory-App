import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Screen from './components/Screen';
import Container from './components/Container';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UniversalHeader from '../components/UniversalHeader';

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
}

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ContactSupervisors() {
  const [user, setUser] = useState<User | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [sending, setSending] = useState(false);

  const urgencyLevels = [
    { id: 'low', label: '🟢 Low Priority', description: 'General question or suggestion' },
    { id: 'normal', label: '🟡 Normal Priority', description: 'Need help with app feature' },
    { id: 'high', label: '🟠 High Priority', description: 'App not working properly' },
    { id: 'urgent', label: '🔴 Urgent', description: 'Can\'t work - need immediate help' }
  ];

  const commonIssues = [
    "Can't log deliveries",
    "QR scanner not working", 
    "App keeps crashing",
    "Missing inventory items",
    "Can't access certain features",
    "Need training on new feature"
  ];

  useEffect(() => {
    loadUserData();
  }, []);

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

  const sendHelpRequest = async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Missing Information', 'Please provide both a subject and description of your issue.');
      return;
    }

    setSending(true);

    try {
      const helpRequest = {
        user_id: user?.id || 'unknown',
        user_name: user?.name || 'Unknown User',
        user_role: user?.role || 'unknown',
        subject: subject.trim(),
        description: description.trim(),
        urgency_level: urgency,
        timestamp: new Date().toISOString(),
        status: 'open',
        assigned_to: urgency === 'urgent' ? 'both_supervisors' : 'next_available'
      };

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/help-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(helpRequest),
      });

      if (response.ok) {
        const result = await response.json();
        
        Alert.alert(
          '✅ Help Request Sent!',
          `Your request has been sent to the supervisors.\n\nRequest ID: ${result.id}\n\nLee Carter and Dan Carter will be notified and will help you soon.`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                // Clear form and go back to help
                setSubject('');
                setDescription('');
                setUrgency('normal');
                router.push('/help');
              }
            }
          ]
        );
      } else {
        throw new Error('Failed to send help request');
      }

    } catch (error) {
      console.error('Error sending help request:', error);
      Alert.alert(
        'Send Failed',
        'Unable to send your help request right now. Please try again or contact Lee Carter or Dan Brooks directly.',
        [{ text: 'OK' }]
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen scroll>
      <Container>
      {/* Universal Header */}
      <UniversalHeader title="Contact Supervisors" showBackButton={true} />

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content}>
          {/* Introduction */}
          <View style={styles.introSection}>
            <Text style={styles.introTitle}>📞 Contact Your Supervisors</Text>
            <Text style={styles.introText}>
              Need help that you can't find in the guides? Send a request directly to 
              Lee Carter and Dan Carter. They'll get back to you as soon as possible.
            </Text>
            
            <View style={styles.supervisorInfo}>
              <View style={styles.supervisorCard}>
                <Ionicons name="person-circle" size={32} color="#4CAF50" />
                <Text style={styles.supervisorName}>Lee Carter</Text>
                <Text style={styles.supervisorRole}>Supervisor</Text>
              </View>
              <View style={styles.supervisorCard}>
                <Ionicons name="person-circle" size={32} color="#2196F3" />
                <Text style={styles.supervisorName}>Dan Carter</Text>
                <Text style={styles.supervisorRole}>Supervisor</Text>
              </View>
            </View>
          </View>

          {/* Quick Issues */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Common Issues (Tap to Use)</Text>
            <View style={styles.commonIssues}>
              {commonIssues.map((issue, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.issueChip}
                  onPress={() => setSubject(issue)}
                >
                  <Text style={styles.issueChipText}>{issue}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Urgency Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ How Urgent Is This?</Text>
            <View style={styles.urgencyOptions}>
              {urgencyLevels.map((level) => (
                <TouchableOpacity 
                  key={level.id}
                  style={[
                    styles.urgencyOption,
                    urgency === level.id && styles.urgencyOptionSelected
                  ]}
                  onPress={() => setUrgency(level.id)}
                >
                  <Text style={[
                    styles.urgencyLabel,
                    urgency === level.id && styles.urgencyLabelSelected
                  ]}>
                    {level.label}
                  </Text>
                  <Text style={[
                    styles.urgencyDescription,
                    urgency === level.id && styles.urgencyDescriptionSelected
                  ]}>
                    {level.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Subject */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 What's the Issue? *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Brief summary of your problem..."
              placeholderTextColor="#999"
              value={subject}
              onChangeText={setSubject}
              maxLength={100}
            />
            <Text style={styles.characterCount}>{subject.length}/100</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Please Describe in Detail *</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              placeholder="What exactly is happening? What have you tried? When did it start?"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              maxLength={500}
            />
            <Text style={styles.characterCount}>{description.length}/500</Text>
          </View>

          {/* User Info Display */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Your Information</Text>
            <View style={styles.userInfo}>
              <Text style={styles.userInfoText}>Name: {user?.name || 'Unknown'}</Text>
              <Text style={styles.userInfoText}>Role: {user?.role || 'Unknown'}</Text>
              <Text style={styles.userInfoText}>Request Time: {new Date().toLocaleString()}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Send Button */}
        <View style={styles.sendButtonContainer}>
          <TouchableOpacity 
            style={[styles.sendButton, (!subject.trim() || !description.trim() || sending) && styles.sendButtonDisabled]}
            onPress={sendHelpRequest}
            disabled={!subject.trim() || !description.trim() || sending}
          >
            {sending ? (
              <Text style={styles.sendButtonText}>📤 Sending...</Text>
            ) : (
              <Text style={styles.sendButtonText}>📞 Send Help Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  keyboardContainer: {
    flex: 1,
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
    marginBottom: 16,
  },
  supervisorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  supervisorCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#404040',
    borderRadius: 8,
    minWidth: 120,
  },
  supervisorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  supervisorRole: {
    color: '#999',
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  commonIssues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  issueChip: {
    backgroundColor: '#404040',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 4,
  },
  issueChipText: {
    color: '#FF9800',
    fontSize: 14,
  },
  urgencyOptions: {
    gap: 8,
  },
  urgencyOption: {
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#404040',
  },
  urgencyOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#1B5E20',
  },
  urgencyLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  urgencyLabelSelected: {
    color: '#4CAF50',
  },
  urgencyDescription: {
    color: '#999',
    fontSize: 14,
  },
  urgencyDescriptionSelected: {
    color: '#ccc',
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
  textAreaInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: '#999',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  userInfo: {
    backgroundColor: '#2d2d2d',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#404040',
  },
  userInfoText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  sendButtonContainer: {
    padding: 16,
    backgroundColor: '#2d2d2d',
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
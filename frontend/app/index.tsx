import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppErrorHandler } from '../utils/AppErrorHandler';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { AccessibleButton, AccessibleCard, FloatingHelpButton, VoiceCommandButton } from '../components/AccessibleComponents';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

interface User {
  id: string;
  name: string;
  role: 'supervisor' | 'engineer';
  created_at: string;
}

interface Stats {
  materials: number;
  tools: number;
  lowStock: number;
  todayTransactions: number;
  healthScore: number;
}

interface PriorityItem {
  id: string;
  name: string;
  type: 'material' | 'tool';
  priority: 'urgent' | 'medium' | 'low';
  reason: string;
  icon: string;
}

interface TeamActivity {
  id: string;
  user: string;
  action: string;
  item: string;
  time: string;
  type: 'take' | 'restock' | 'add' | 'scan';
}

export default function Index() {
  const { settings, updateSettings, getColors, getTextSize, getButtonSize, speak, playSound, addToRecent } = useAccessibility();
  const colors = getColors();
  const textSize = getTextSize();
  const buttonSize = getButtonSize();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats>({ materials: 0, tools: 0, lowStock: 0, todayTransactions: 0, healthScore: 86 });
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [showAccessibilityHint, setShowAccessibilityHint] = useState(false);

  useEffect(() => {
    AppErrorHandler.initialize();
    fetchUsers();
    checkAccessibilityHint();
  }, []);

  const checkAccessibilityHint = async () => {
    try {
      const hasSeenHint = await AsyncStorage.getItem('accessibility_hint_shown');
      if (!hasSeenHint) {
        setShowAccessibilityHint(true);
        await AsyncStorage.setItem('accessibility_hint_shown', 'true');
      }
    } catch (error) {
      console.error('Error checking accessibility hint:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/users`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        
        // Auto-select preferred user if set
        if (settings.preferredUser) {
          const preferred = data.find((user: User) => user.id === settings.preferredUser);
          if (preferred) {
            setSelectedUser(preferred);
            speak(`Welcome back, ${preferred.name}`);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      AppErrorHandler.handleError(error, 'Failed to load team members');
    }
  };

  const handleUserSelection = (user: User) => {
    playSound('click');
    setSelectedUser(user);
    setPin('');
    setError('');
    
    // Save as preferred user
    updateSettings({ preferredUser: user.id });
    
    speak(`Selected ${user.name}, ${user.role}`);
    setShowPinModal(true);
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      setError('PIN must be 4 digits');
      speak('PIN must be 4 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await AppErrorHandler.safeNetworkCall(
        `${EXPO_PUBLIC_BACKEND_URL}/api/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: selectedUser?.id, pin }),
        },
        'Login'
      );

      if (response) {
        await AsyncStorage.setItem('user', JSON.stringify(selectedUser));
        playSound('success');
        speak(`Welcome ${selectedUser?.name}! Taking you to your dashboard.`);
        
        // Add to recent activity
        addToRecent(selectedUser?.id || '', selectedUser?.name || '');
        
        router.replace('/dashboard');
      } else {
        setError('Invalid PIN. Please try again.');
        speak('Invalid PIN. Please try again.');
        playSound('error');
        shakeError();
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
      speak('Login failed. Please try again.');
      playSound('error');
      shakeError();
    } finally {
      setLoading(false);
    }
  };

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleManualPinEntry = () => {
    Alert.alert(
      '🔢 Manual PIN Entry',
      'If you have trouble with the PIN pad, you can type your PIN manually.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Type PIN',
          onPress: () => {
            setPin('');
            speak('You can now type your PIN manually');
          }
        }
      ]
    );
  };

  const getUserRoleIcon = (role: string) => {
    return role === 'supervisor' ? 'star' : 'person';
  };

  const getUserRoleColor = (role: string) => {
    return role === 'supervisor' ? colors.warning : colors.primary;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      
      {/* Accessibility Hint Modal */}
      <Modal
        visible={showAccessibilityHint}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAccessibilityHint(false)}
      >
        <View style={styles.hintModalOverlay}>
          <View style={[styles.hintModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="accessibility" size={48} color={colors.primary} />
            <Text style={[styles.hintTitle, { color: colors.text, fontSize: textSize + 4 }]}>
              🌟 Accessibility Features Available
            </Text>
            <Text style={[styles.hintText, { color: colors.textSecondary, fontSize: textSize }]}>
              This app includes special features to make it easier to use for everyone, including larger text, voice guidance, and simplified navigation.
            </Text>
            
            <View style={styles.hintButtons}>
              <AccessibleButton
                title="🚀 Enable Easy Mode"
                onPress={() => {
                  updateSettings({
                    textSize: 'extra-large',
                    highContrast: true,
                    largeTouchTargets: true,
                    boldText: true,
                    audioFeedback: true,
                    readAloud: true,
                    bigButtonMode: true,
                    tutorialMode: true,
                  });
                  speak('Easy mode activated. All accessibility features are now enabled.');
                  setShowAccessibilityHint(false);
                }}
                variant="success"
              />
              <AccessibleButton
                title="⚙️ Customize Settings"
                onPress={() => {
                  setShowAccessibilityHint(false);
                  router.push('/accessibility-settings');
                }}
                variant="secondary"
              />
              <AccessibleButton
                title="Continue"
                onPress={() => setShowAccessibilityHint(false)}
                variant="primary"
              />
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.text, fontSize: textSize + 8, fontWeight: settings.boldText ? 'bold' : '600' }]}>
              Welcome to Your
            </Text>
            <Text style={[styles.subtitle, { color: colors.primary, fontSize: textSize + 6, fontWeight: settings.boldText ? 'bold' : '600' }]}>
              Digital Toolkit! 🛠️
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary, fontSize: textSize }]}>
              Select your profile to get started
            </Text>
          </View>

          {/* Accessibility Button */}
          <TouchableOpacity
            style={[styles.accessibilityButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/accessibility-settings')}
            accessible={true}
            accessibilityLabel="Open accessibility settings"
            accessibilityRole="button"
          >
            <Ionicons name="accessibility" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Team Members */}
        <View style={styles.teamSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: textSize + 2, fontWeight: settings.boldText ? 'bold' : '600' }]}>
            👥 Team Members
          </Text>
          
          {users.map((user) => (
            <AccessibleCard
              key={user.id}
              onPress={() => handleUserSelection(user)}
              accessibilityLabel={`Login as ${user.name}, ${user.role}`}
            >
              <View style={styles.userCard}>
                <View style={[styles.userIcon, { backgroundColor: getUserRoleColor(user.role) }]}>
                  <Ionicons name={getUserRoleIcon(user.role)} size={settings.bigButtonMode ? 32 : 24} color="white" />
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.text, fontSize: textSize + 2, fontWeight: settings.boldText ? 'bold' : '600' }]}>
                    {user.name}
                  </Text>
                  <Text style={[styles.userRole, { color: getUserRoleColor(user.role), fontSize: textSize }]}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Text>
                </View>
                {settings.preferredUser === user.id && (
                  <View style={styles.preferredBadge}>
                    <Ionicons name="heart" size={16} color={colors.error} />
                  </View>
                )}
              </View>
            </AccessibleCard>
          ))}
        </View>

        {/* Quick Stats */}
        {!settings.simplifiedUI && (
          <AccessibleCard>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: textSize + 2, fontWeight: settings.boldText ? 'bold' : '600' }]}>
              📊 Quick Overview
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary, fontSize: textSize + 4 }]}>
                  {stats.materials}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: textSize - 2 }]}>
                  Materials
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.success, fontSize: textSize + 4 }]}>
                  {stats.tools}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: textSize - 2 }]}>
                  Tools
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.warning, fontSize: textSize + 4 }]}>
                  {stats.lowStock}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: textSize - 2 }]}>
                  Low Stock
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: colors.primary, fontSize: textSize + 4 }]}>
                  {stats.todayTransactions}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: textSize - 2 }]}>
                  Today
                </Text>
              </View>
            </View>
          </AccessibleCard>
        )}
      </ScrollView>

      {/* PIN Modal */}
      <Modal
        visible={showPinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent, 
              { 
                backgroundColor: colors.surface, 
                borderColor: colors.border,
                transform: [{ translateX: shakeAnimation }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowPinModal(false);
                  playSound('click');
                }}
                style={[styles.modalCloseButton, { width: buttonSize * 0.8, height: buttonSize * 0.8 }]}
                accessible={true}
                accessibilityLabel="Close PIN entry"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: textSize + 4, fontWeight: settings.boldText ? 'bold' : '600' }]}>
                Enter PIN
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontSize: textSize }]}>
                Welcome back, {selectedUser?.name}! 👋
              </Text>

              {/* PIN Display */}
              <View style={styles.pinDisplay}>
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.pinDot,
                      { 
                        backgroundColor: index < pin.length ? colors.primary : colors.surface,
                        borderColor: colors.border 
                      }
                    ]}
                  />
                ))}
              </View>

              {/* Error Message */}
              {error ? (
                <Text style={[styles.errorText, { color: colors.error, fontSize: textSize }]}>
                  {error}
                </Text>
              ) : null}

              {/* PIN Input */}
              <TextInput
                style={[styles.hiddenInput, { color: colors.text, fontSize: textSize }]}
                value={pin}
                onChangeText={(text) => {
                  if (text.length <= 4 && /^\d*$/.test(text)) {
                    setPin(text);
                    setError('');
                    if (settings.audioFeedback) {
                      playSound('click');
                    }
                  }
                }}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry={true}
                autoFocus={true}
                placeholder="Enter 4-digit PIN"
                placeholderTextColor={colors.textSecondary}
                accessible={true}
                accessibilityLabel="PIN input field"
              />

              <Text style={[styles.pinHint, { color: colors.textSecondary, fontSize: textSize - 2 }]}>
                Enter your 4-digit PIN to continue
              </Text>

              {/* Action Buttons */}
              <View style={styles.pinActions}>
                <AccessibleButton
                  title="Login"
                  onPress={handlePinSubmit}
                  disabled={pin.length !== 4 || loading}
                  loading={loading}
                  variant="primary"
                  accessibilityLabel="Submit PIN and login"
                />
                
                <AccessibleButton
                  title="🔢 Manual Entry"
                  onPress={handleManualPinEntry}
                  variant="secondary"
                  size="small"
                  accessibilityLabel="Switch to manual PIN entry"
                />
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <FloatingHelpButton />
      <VoiceCommandButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  headerContent: {
    alignItems: 'center',
  },
  accessibilityButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
  },
  teamSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  userIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    marginBottom: 4,
  },
  userRole: {
    textTransform: 'capitalize',
  },
  preferredBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCloseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  modalBody: {
    padding: 24,
    paddingTop: 0,
    alignItems: 'center',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 16,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  hiddenInput: {
    opacity: 0,
    position: 'absolute',
    width: 1,
    height: 1,
  },
  pinHint: {
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  pinActions: {
    width: '100%',
    gap: 12,
  },
  hintModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  hintModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  hintTitle: {
    textAlign: 'center',
    marginVertical: 16,
  },
  hintText: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  hintButtons: {
    width: '100%',
    gap: 12,
  },
});
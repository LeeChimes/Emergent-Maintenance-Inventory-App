// frontend/app/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Screen from './components/Screen';
import Container from './components/Container';

export default function Login() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !pin.trim()) {
      Alert.alert('Error', 'Please enter your name and PIN');
      return;
    }
    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }

    setLoading(true);
    try {
      // Mock validation — replace with backend auth later
      let role: 'supervisor' | 'engineer' = 'engineer';
      if (username.toLowerCase().includes('dan') || username.toLowerCase().includes('lee')) {
        role = 'supervisor';
      }

      const userData = { id: Date.now().toString(), name: username.trim(), role };
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      // Route based on role
      if (role === 'supervisor') {
        router.replace('/maintenance-hub');
      } else {
        router.replace('/engineer-hub');
      }
    } catch (err) {
      Alert.alert('Login failed', 'Unexpected error, please try again');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Container>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.center}
        >
          <Ionicons name="construct" size={64} color="#4CAF50" />
          <Text style={styles.title}>Maintenance Hub</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="4-digit PIN"
            placeholderTextColor="#666"
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
          />

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginTxt}>{loading ? 'Signing in…' : 'Login'}</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#aaa', fontSize: 16, marginBottom: 20 },
  input: {
    backgroundColor: '#2d2d2d',
    color: '#fff',
    width: '100%',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  loginBtn: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  loginTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

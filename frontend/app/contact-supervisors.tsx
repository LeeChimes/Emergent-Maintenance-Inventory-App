// frontend/app/contact-supervisors.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from './components/Screen';
import Container from './components/Container';
import UniversalHeader from './components/UniversalHeader';

export default function ContactSupervisors() {
  const contacts = [
    { name: 'Lee Carter', phone: '+44 7000 000001', icon: 'call' as const },
    { name: 'Dan Carter', phone: '+44 7000 000002', icon: 'call' as const },
    { name: 'Control Room', phone: '+44 7000 000003', icon: 'call' as const },
  ];

  const call = (phone: string) => Linking.openURL(`tel:${phone}`);

  return (
    <Screen scroll>
      <Container>
        <UniversalHeader title="Contact Supervisors" showBackButton />

        <View style={styles.content}>
          {contacts.map((c) => (
            <View key={c.phone} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.phone}>{c.phone}</Text>
              </View>
              <TouchableOpacity style={styles.callBtn} onPress={() => call(c.phone)}>
                <Ionicons name={c.icon} size={20} color="#fff" />
                <Text style={styles.callTxt}>Call</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  card: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  phone: { color: '#bbb', fontSize: 14, marginTop: 4 },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  callTxt: { color: '#fff', fontWeight: '800' },
});

// frontend/app/ai-help.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from './components/Screen';
import Container from './components/Container';
import UniversalHeader from './components/UniversalHeader';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';

export default function AIHelp() {
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const onAsk = async () => {
    const q = prompt.trim();
    if (!q) return;
    setLoading(true);
    setAnswer('');

    try {
      if (EXPO_PUBLIC_BACKEND_URL) {
        // If your backend has an AI endpoint, wire it here.
        // Example (adjust to your real endpoint shape):
        const res = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/ai/help`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: q }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAnswer(data?.answer ?? 'No response text was returned.');
      } else {
        // Safe fallback: local mock so the screen works without backend
        setAnswer(
          [
            'This is a local demo response (no backend URL set).',
            '',
            '• Tip: You can scan a QR from any page using the green button.',
            '• PPMs: Scanning a fire door routes here and highlights the task.',
            '• Inventory: Scanning an asset/tool/part routes to the item.',
            '• Deliveries: Scanning a delivery QR routes and focuses it.',
          ].join('\n')
        );
      }
    } catch (e: any) {
      setAnswer(`Sorry, I couldn’t fetch an answer.\n\n${String(e?.message || e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Container>
        <UniversalHeader title="AI Help" showBackButton />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
        >
          <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <Text style={styles.label}>Ask a question</Text>
              <View style={styles.inputRow}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#aaa" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., How do I complete a fire door PPM?"
                  placeholderTextColor="#666"
                  value={prompt}
                  onChangeText={setPrompt}
                  multiline
                />
              </View>

              <TouchableOpacity style={styles.askBtn} onPress={onAsk} disabled={loading}>
                {loading ? (
                  <ActivityIndicator />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.askTxt}>Ask</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>Answer</Text>
              {loading ? (
                <View style={styles.answerLoading}>
                  <ActivityIndicator />
                  <Text style={styles.answerHint}>Thinking…</Text>
                </View>
              ) : answer ? (
                <Text style={styles.answer}>{answer}</Text>
              ) : (
                <Text style={styles.placeholder}>
                  Your answer will appear here. Try asking about PPM steps, QR scanning, or inventory.
                </Text>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 16 },
  card: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#333',
  },
  label: { color: '#fff', fontWeight: '800', fontSize: 16, marginBottom: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    minHeight: 60,
    color: '#fff',
    fontSize: 15,
    paddingTop: 2,
  },
  askBtn: {
    marginTop: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  askTxt: { color: '#fff', fontWeight: '800' },
  answerLoading: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  answerHint: { color: '#aaa' },
  answer: { color: '#ddd', lineHeight: 20 },
  placeholder: { color: '#777' },
});

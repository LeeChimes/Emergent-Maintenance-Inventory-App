// frontend/app/ai-help.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from './components/Screen';
import Container from './components/Container';
import UniversalHeader from './components/UniversalHeader';

export default function AiHelp() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);

    // Mock AI response — replace later with backend/LLM call
    setTimeout(() => {
      setResponse(
        `You asked: "${query}".\n\nHere’s a helpful suggestion:\n- Check the relevant PPM.\n- Review incident logs.\n- If still stuck, contact supervisor.`
      );
      setLoading(false);
    }, 1200);
  };

  return (
    <Screen>
      <Container>
        <UniversalHeader title="AI Help" showBackButton />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.inputSection}>
            <TextInput
              style={styles.input}
              placeholder="Ask a question about maintenance..."
              placeholderTextColor="#777"
              value={query}
              onChangeText={setQuery}
              multiline
            />
            <TouchableOpacity style={styles.askBtn} onPress={handleAsk}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.responseSection}>
            {loading && (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingTxt}>Thinking...</Text>
              </View>
            )}

            {response && (
              <View style={styles.answerCard}>
                <Text style={styles.answerTxt}>{response}</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    margin: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    minHeight: 40,
  },
  askBtn: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  responseSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  center: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  loadingTxt: {
    color: '#aaa',
    fontSize: 14,
  },
  answerCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  answerTxt: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
});

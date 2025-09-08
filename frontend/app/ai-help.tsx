import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import UniversalHeader from '../components/UniversalHeader';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AIHelp() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  const commonQuestions = [
    "How do I log a delivery?",
    "QR scanner not working",
    "How to add new inventory items?",
    "Can't see Log Delivery button",
    "How to do stock count?",
    "App won't load or crashes"
  ];

  const askAI = async (userQuestion) => {
    if (!userQuestion.trim()) return;
    
    setLoading(true);
    const currentQuestion = userQuestion.trim();
    
    try {
      // Add user question to conversation
      const newConversation = [...conversationHistory, { type: 'user', text: currentQuestion }];
      setConversationHistory(newConversation);
      setQuestion('');

      // Create context about the app for the AI
      const appContext = `
You are a helpful assistant for the Chimes Shopping Centre Asset Inventory Mobile App. 

APP OVERVIEW:
- Used by maintenance team (5 members: 2 supervisors, 3 engineers)
- Manages materials and tools with QR codes
- Features: QR Scanner, Inventory Management, Deliveries, Suppliers, Stock-taking
- Users: Engineers (basic access) and Supervisors (full access including settings)

KEY FEATURES:
1. DASHBOARD: Main screen with colored buttons for different functions
2. QR SCANNER: Scan item codes or enter manually for check-in/out
3. INVENTORY: View all materials and tools, add new items
4. DELIVERIES: ALL users can log deliveries manually (no camera currently)
5. SUPPLIERS: Manage supplier information (supervisors only)
6. STOCK-TAKE: Count inventory items and update quantities

COMMON ISSUES:
- Log Delivery button: Available for ALL users on main dashboard (purple button)
- QR Scanner: Has manual entry option if camera fails
- Navigation: Use back arrow or home icon, help available everywhere
- App crashes: Close and reopen app, or restart device

Please provide step-by-step instructions for the user's question. Be clear, concise, and helpful for non-technical users.

User Question: ${currentQuestion}
`;

      const aiResponse = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: appContext,
          conversation_history: newConversation
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const aiAnswer = aiData.response || "I couldn't generate a response. Please try asking your question differently or contact your supervisors for help.";
        
        // Add AI response to conversation
        setConversationHistory([...newConversation, { type: 'ai', text: aiAnswer }]);
      } else {
        throw new Error('AI service unavailable');
      }
      
    } catch (error) {
      console.error('AI Help Error:', error);
      // Add error response to conversation
      const errorResponse = `I'm having trouble connecting to the AI service right now. Here are some general tips:

📱 **For app issues:** Try closing and reopening the app
🔍 **For specific help:** Check the help categories in the main help menu
📞 **Need more help?** Use "Contact Supervisors" from the main help screen

Please try again in a moment, or browse the detailed help sections.`;
      
      setConversationHistory([...conversationHistory, 
        { type: 'user', text: currentQuestion },
        { type: 'ai', text: errorResponse }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setConversationHistory([]);
    setResponse('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Universal Header */}
      <UniversalHeader title="AI Help Assistant" showBackButton={true} />

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Conversation */}
        <ScrollView style={styles.conversationContainer}>
          {conversationHistory.length === 0 ? (
            <View style={styles.welcomeSection}>
              <View style={styles.welcomeHeader}>
                <Text style={styles.welcomeTitle}>🤖 AI Help Assistant</Text>
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={clearConversation}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="refresh" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              <Text style={styles.welcomeText}>
                Ask me anything about using the app! I can help with deliveries, scanning, 
                inventory, troubleshooting, and more.
              </Text>
              
              <Text style={styles.examplesTitle}>💡 Try asking:</Text>
              <View style={styles.commonQuestions}>
                {commonQuestions.map((q, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.questionChip}
                    onPress={() => askAI(q)}
                  >
                    <Text style={styles.questionChipText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.conversationList}>
              {conversationHistory.map((message, index) => (
                <View key={index} style={[
                  styles.messageContainer,
                  message.type === 'user' ? styles.userMessage : styles.aiMessage
                ]}>
                  <View style={[
                    styles.messageBubble,
                    message.type === 'user' ? styles.userBubble : styles.aiBubble
                  ]}>
                    {message.type === 'ai' && (
                      <View style={styles.aiHeader}>
                        <Ionicons name="sparkles" size={16} color="#4CAF50" />
                        <Text style={styles.aiLabel}>AI Assistant</Text>
                      </View>
                    )}
                    <Text style={[
                      styles.messageText,
                      message.type === 'user' ? styles.userText : styles.aiText
                    ]}>
                      {message.text}
                    </Text>
                  </View>
                </View>
              ))}
              
              {loading && (
                <View style={[styles.messageContainer, styles.aiMessage]}>
                  <View style={[styles.messageBubble, styles.aiBubble]}>
                    <View style={styles.aiHeader}>
                      <Ionicons name="sparkles" size={16} color="#4CAF50" />
                      <Text style={styles.aiLabel}>AI Assistant</Text>
                    </View>
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#4CAF50" />
                      <Text style={styles.loadingText}>Thinking...</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask me anything about the app..."
            placeholderTextColor="#999"
            value={question}
            onChangeText={setQuestion}
            multiline
            onSubmitEditing={() => askAI(question)}
            editable={!loading}
          />
          <TouchableOpacity 
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={() => askAI(question)}
            disabled={loading || !question.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
  },
  conversationContainer: {
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
    marginBottom: 16,
  },
  examplesTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  commonQuestions: {
    gap: 8,
  },
  questionChip: {
    backgroundColor: '#404040',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  questionChipText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  conversationList: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#2196F3',
  },
  aiBubble: {
    backgroundColor: '#2d2d2d',
    borderWidth: 1,
    borderColor: '#404040',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiLabel: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#ccc',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#999',
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2d2d2d',
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#404040',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { 
  AccessibleHeader, 
  AccessibleButton, 
  AccessibleCard,
  FloatingHelpButton,
  VoiceCommandButton 
} from '../components/AccessibleComponents';
import { Ionicons } from '@expo/vector-icons';

export default function AccessibilitySettings() {
  const { settings, updateSettings, getColors, getTextSize, speak } = useAccessibility();
  const colors = getColors();
  const textSize = getTextSize();

  const [testingMode, setTestingMode] = useState(false);

  const handleTestFeature = (featureName: string) => {
    setTestingMode(true);
    speak(`Testing ${featureName} feature`);
    
    setTimeout(() => {
      setTestingMode(false);
      speak(`${featureName} test complete`);
    }, 2000);
  };

  const SettingCard: React.FC<{
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    testFeature?: () => void;
    icon: string;
  }> = ({ title, description, value, onValueChange, testFeature, icon }) => (
    <AccessibleCard accessibilityLabel={`${title} setting`}>
      <View style={styles.settingItem}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon as any} size={32} color={colors.primary} />
        </View>
        
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.text, fontSize: textSize + 2, fontWeight: settings.boldText ? 'bold' : '600' }]}>
            {title}
          </Text>
          <Text style={[styles.settingDescription, { color: colors.textSecondary, fontSize: textSize - 2 }]}>
            {description}
          </Text>
          
          <View style={styles.settingControls}>
            <Switch
              value={value}
              onValueChange={(newValue) => {
                speak(newValue ? `${title} enabled` : `${title} disabled`);
                onValueChange(newValue);
              }}
              trackColor={{ false: colors.textSecondary, true: colors.primary }}
              thumbColor={value ? colors.success : colors.surface}
              style={styles.switch}
              accessible={true}
              accessibilityLabel={`Toggle ${title}`}
              accessibilityRole="switch"
              accessibilityState={{ checked: value }}
            />
            
            {testFeature && (
              <AccessibleButton
                title="Test"
                onPress={testFeature}
                size="small"
                variant="secondary"
                disabled={testingMode}
                loading={testingMode}
                accessibilityLabel={`Test ${title} feature`}
              />
            )}
          </View>
        </View>
      </View>
    </AccessibleCard>
  );

  const TextSizeCard: React.FC = () => (
    <AccessibleCard accessibilityLabel="Text size settings">
      <View style={styles.settingItem}>
        <View style={styles.settingIcon}>
          <Ionicons name="text" size={32} color={colors.primary} />
        </View>
        
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: colors.text, fontSize: textSize + 2, fontWeight: settings.boldText ? 'bold' : '600' }]}>
            Text Size
          </Text>
          <Text style={[styles.settingDescription, { color: colors.textSecondary, fontSize: textSize - 2 }]}>
            Choose the text size that's comfortable for you
          </Text>
          
          <View style={styles.textSizeOptions}>
            {(['normal', 'large', 'extra-large'] as const).map((size) => (
              <AccessibleButton
                key={size}
                title={size === 'extra-large' ? 'Extra Large' : size.charAt(0).toUpperCase() + size.slice(1)}
                onPress={() => {
                  speak(`Text size set to ${size}`);
                  updateSettings({ textSize: size });
                }}
                variant={settings.textSize === size ? 'primary' : 'secondary'}
                size="small"
                accessibilityLabel={`Set text size to ${size}`}
              />
            ))}
          </View>
          
          <Text style={[styles.previewText, { fontSize: textSize, color: colors.text }]}>
            Preview: This is how text will look
          </Text>
        </View>
      </View>
    </AccessibleCard>
  );

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all accessibility settings to their default values. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            updateSettings({
              textSize: 'normal',
              highContrast: false,
              largeTouchTargets: false,
              boldText: false,
              audioFeedback: false,
              voiceCommands: false,
              readAloud: false,
              showBreadcrumbs: true,
              bigButtonMode: false,
              simplifiedUI: false,
              tutorialMode: false,
              smartSuggestions: true,
              confirmationDialogs: true,
            });
            speak('Settings reset to defaults');
          }
        }
      ]
    );
  };

  const activateEasyMode = () => {
    updateSettings({
      textSize: 'extra-large',
      highContrast: true,
      largeTouchTargets: true,
      boldText: true,
      audioFeedback: true,
      readAloud: true,
      showBreadcrumbs: true,
      bigButtonMode: true,
      simplifiedUI: true,
      tutorialMode: true,
      confirmationDialogs: true,
    });
    speak('Easy mode activated. All accessibility features are now enabled for the best possible experience.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AccessibleHeader 
        title="Accessibility Settings"
        breadcrumbs={['Dashboard', 'Settings', 'Accessibility']}
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Setup */}
        <AccessibleCard>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: textSize + 4, fontWeight: settings.boldText ? 'bold' : '600' }]}>
            🚀 Quick Setup
          </Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary, fontSize: textSize }]}>
            Get started quickly with pre-configured accessibility settings
          </Text>
          
          <View style={styles.quickSetupButtons}>
            <AccessibleButton
              title="🌟 Easy Mode"
              onPress={activateEasyMode}
              variant="success"
              accessibilityLabel="Activate easy mode with all accessibility features enabled"
            />
            <AccessibleButton
              title="🔄 Reset to Defaults"
              onPress={resetToDefaults}
              variant="secondary"
              accessibilityLabel="Reset all settings to default values"
            />
          </View>
        </AccessibleCard>

        {/* Vision Settings */}
        <Text style={[styles.categoryTitle, { color: colors.primary, fontSize: textSize + 2, fontWeight: settings.boldText ? 'bold' : '600' }]}>
          👁️ Vision & Display
        </Text>

        <TextSizeCard />

        <SettingCard
          title="High Contrast"
          description="Use high contrast colors for better visibility"
          value={settings.highContrast}
          onValueChange={(value) => updateSettings({ highContrast: value })}
          testFeature={() => handleTestFeature('High Contrast')}
          icon="contrast"
        />

        <SettingCard
          title="Bold Text"
          description="Use bold text throughout the app for better readability"
          value={settings.boldText}
          onValueChange={(value) => updateSettings({ boldText: value })}
          testFeature={() => handleTestFeature('Bold Text')}
          icon="text-outline"
        />

        <SettingCard
          title="Large Touch Targets"
          description="Make all buttons and touch areas larger"
          value={settings.largeTouchTargets}
          onValueChange={(value) => updateSettings({ largeTouchTargets: value })}
          testFeature={() => handleTestFeature('Large Touch Targets')}
          icon="finger-print"
        />

        <SettingCard
          title="Big Button Mode"
          description="Display fewer, larger buttons on each screen"
          value={settings.bigButtonMode}
          onValueChange={(value) => updateSettings({ bigButtonMode: value })}
          testFeature={() => handleTestFeature('Big Button Mode')}
          icon="apps"
        />

        {/* Audio Settings */}
        <Text style={[styles.categoryTitle, { color: colors.primary, fontSize: textSize + 2, fontWeight: settings.boldText ? 'bold' : '600' }]}>
          🔊 Audio & Voice
        </Text>

        <SettingCard
          title="Audio Feedback"
          description="Play sounds for button presses and actions"
          value={settings.audioFeedback}
          onValueChange={(value) => updateSettings({ audioFeedback: value })}
          testFeature={() => handleTestFeature('Audio Feedback')}
          icon="volume-high"
        />

        <SettingCard
          title="Read Aloud"
          description="Have the app speak button names and important information"
          value={settings.readAloud}
          onValueChange={(value) => updateSettings({ readAloud: value })}
          testFeature={() => handleTestFeature('Read Aloud')}
          icon="chatbubble"
        />

        <SettingCard
          title="Voice Commands"
          description="Control the app with voice commands like 'Go Home' or 'Scan Item'"
          value={settings.voiceCommands}
          onValueChange={(value) => updateSettings({ voiceCommands: value })}
          testFeature={() => handleTestFeature('Voice Commands')}
          icon="mic"
        />

        {/* Navigation Settings */}
        <Text style={[styles.categoryTitle, { color: colors.primary, fontSize: textSize + 2, fontWeight: settings.boldText ? 'bold' : '600' }]}>
          🧭 Navigation & Help
        </Text>

        <SettingCard
          title="Show Breadcrumbs"
          description="Display navigation path at the top of each screen"
          value={settings.showBreadcrumbs}
          onValueChange={(value) => updateSettings({ showBreadcrumbs: value })}
          testFeature={() => handleTestFeature('Breadcrumbs')}
          icon="trail-sign"
        />

        <SettingCard
          title="Tutorial Mode"
          description="Show help buttons and additional guidance"
          value={settings.tutorialMode}
          onValueChange={(value) => updateSettings({ tutorialMode: value })}
          testFeature={() => handleTestFeature('Tutorial Mode')}
          icon="help-circle"
        />

        <SettingCard
          title="Confirmation Dialogs"
          description="Ask for confirmation before important actions"
          value={settings.confirmationDialogs}
          onValueChange={(value) => updateSettings({ confirmationDialogs: value })}
          testFeature={() => handleTestFeature('Confirmation Dialogs')}
          icon="checkmark-circle"
        />

        <SettingCard
          title="Smart Suggestions"
          description="Show helpful suggestions and autocomplete options"
          value={settings.smartSuggestions}
          onValueChange={(value) => updateSettings({ smartSuggestions: value })}
          testFeature={() => handleTestFeature('Smart Suggestions')}
          icon="bulb"
        />

        <SettingCard
          title="Simplified UI"
          description="Hide advanced features and show only essential controls"
          value={settings.simplifiedUI}
          onValueChange={(value) => updateSettings({ simplifiedUI: value })}
          testFeature={() => handleTestFeature('Simplified UI')}
          icon="layers"
        />

        {/* Info Section */}
        <AccessibleCard>
          <Text style={[styles.infoTitle, { color: colors.text, fontSize: textSize + 2, fontWeight: settings.boldText ? 'bold' : '600' }]}>
            ℹ️ About Accessibility Features
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary, fontSize: textSize }]}>
            These settings help make the app easier to use for everyone, especially those with vision challenges or who prefer larger text and buttons. All settings are saved automatically and will be remembered when you restart the app.
          </Text>
          
          <AccessibleButton
            title="Test Voice: 'Hello, accessibility features are working great!'"
            onPress={() => speak('Hello, accessibility features are working great!')}
            variant="secondary"
            icon="volume-high"
            accessibilityLabel="Test voice feedback"
          />
        </AccessibleCard>

        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingHelpButton />
      <VoiceCommandButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
    lineHeight: 24,
  },
  categoryTitle: {
    marginTop: 24,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  settingIcon: {
    marginRight: 16,
    marginTop: 4,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    marginBottom: 4,
  },
  settingDescription: {
    marginBottom: 12,
    lineHeight: 20,
  },
  settingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  textSizeOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  previewText: {
    fontStyle: 'italic',
    marginTop: 8,
  },
  quickSetupButtons: {
    gap: 12,
  },
  infoTitle: {
    marginBottom: 12,
  },
  infoText: {
    lineHeight: 24,
    marginBottom: 16,
  },
});
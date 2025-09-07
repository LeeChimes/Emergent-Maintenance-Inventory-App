import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Accessible Header Component
export const AccessibleHeader: React.FC<{
  title: string;
  showBack?: boolean;
  showHome?: boolean;
  rightAction?: () => void;
  rightIcon?: string;
  breadcrumbs?: string[];
}> = ({ title, showBack = true, showHome = true, rightAction, rightIcon, breadcrumbs }) => {
  const { settings, getColors, getTextSize, getButtonSize, speak, playSound } = useAccessibility();
  const colors = getColors();
  const textSize = getTextSize();
  const buttonSize = getButtonSize();

  return (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      {/* Breadcrumbs */}
      {settings.showBreadcrumbs && breadcrumbs && (
        <View style={styles.breadcrumbContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={[styles.breadcrumb, { color: colors.textSecondary, fontSize: textSize - 4 }]}>
              {breadcrumbs.join(' > ')}
            </Text>
          </ScrollView>
        </View>
      )}
      
      {/* Main Header */}
      <View style={styles.headerMain}>
        <View style={styles.headerLeft}>
          {showBack && (
            <TouchableOpacity
              style={[styles.headerButton, { width: buttonSize, height: buttonSize }]}
              onPress={() => {
                playSound('click');
                speak('Going back');
                router.back();
              }}
              accessible={true}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={Math.min(28, buttonSize * 0.4)} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.headerCenter}>
          <Text 
            style={[
              styles.headerTitle, 
              { 
                color: colors.text, 
                fontSize: textSize + 4,
                fontWeight: settings.boldText ? 'bold' : '600'
              }
            ]}
            accessible={true}
            accessibilityLabel={`Current screen: ${title}`}
          >
            {title}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          {showHome && (
            <TouchableOpacity
              style={[styles.headerButton, { width: buttonSize, height: buttonSize }]}
              onPress={() => {
                playSound('click');
                speak('Going home');
                router.push('/dashboard');
              }}
              accessible={true}
              accessibilityLabel="Go to dashboard"
              accessibilityRole="button"
            >
              <Ionicons name="home" size={Math.min(28, buttonSize * 0.4)} color={colors.primary} />
            </TouchableOpacity>
          )}
          
          {rightAction && rightIcon && (
            <TouchableOpacity
              style={[styles.headerButton, { width: buttonSize, height: buttonSize, marginLeft: 8 }]}
              onPress={() => {
                playSound('click');
                rightAction();
              }}
              accessible={true}
              accessibilityLabel="Additional action"
              accessibilityRole="button"
            >
              <Ionicons name={rightIcon as any} size={Math.min(28, buttonSize * 0.4)} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

// Large Accessible Button
export const AccessibleButton: React.FC<{
  title: string;
  onPress: () => void;
  icon?: string;
  color?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}> = ({ 
  title, 
  onPress, 
  icon, 
  color, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  accessibilityLabel
}) => {
  const { settings, getColors, getTextSize, getButtonSize, speak, playSound } = useAccessibility();
  const colors = getColors();
  const textSize = getTextSize();
  const buttonHeight = getButtonSize();

  const getButtonColor = () => {
    if (disabled) return colors.textSecondary;
    if (color) return color;
    
    switch (variant) {
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      case 'secondary': return colors.surface;
      default: return colors.primary;
    }
  };

  const getLocalButtonSize = () => {
    if (settings.bigButtonMode) {
      switch (size) {
        case 'small': return { height: buttonHeight + 8, paddingHorizontal: 20 };
        case 'large': return { height: buttonHeight + 24, paddingHorizontal: 32 };
        default: return { height: buttonHeight + 16, paddingHorizontal: 24 };
      }
    }
    
    switch (size) {
      case 'small': return { height: 40, paddingHorizontal: 16 };
      case 'large': return { height: 56, paddingHorizontal: 24 };
      default: return { height: 48, paddingHorizontal: 20 };
    }
  };

  const handlePress = () => {
    if (disabled || loading) return;
    
    playSound('click');
    if (settings.readAloud) {
      speak(title);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.accessibleButton,
        getButtonSize(),
        {
          backgroundColor: getButtonColor(),
          opacity: disabled ? 0.5 : 1,
          borderColor: variant === 'secondary' ? colors.border : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
        }
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.text : '#fff'} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && (
            <Ionicons 
              name={icon as any} 
              size={textSize + 4} 
              color={variant === 'secondary' ? colors.text : '#fff'} 
              style={title ? styles.buttonIcon : undefined}
            />
          )}
          {title && (
            <Text 
              style={[
                styles.buttonText, 
                { 
                  fontSize: textSize,
                  fontWeight: settings.boldText ? 'bold' : '600',
                  color: variant === 'secondary' ? colors.text : '#fff'
                }
              ]}
            >
              {title}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// Accessible Text Input
export const AccessibleTextInput: React.FC<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  autoFocus?: boolean;
  editable?: boolean;
  accessibilityLabel?: string;
}> = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  multiline = false,
  keyboardType = 'default',
  autoFocus = false,
  editable = true,
  accessibilityLabel
}) => {
  const { settings, getColors, getTextSize, speak } = useAccessibility();
  const colors = getColors();
  const textSize = getTextSize();

  return (
    <View style={styles.inputContainer}>
      <Text 
        style={[
          styles.inputLabel, 
          { 
            color: colors.text, 
            fontSize: textSize,
            fontWeight: settings.boldText ? 'bold' : '600'
          }
        ]}
      >
        {label}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: colors.surface,
            color: colors.text,
            fontSize: textSize,
            borderColor: colors.border,
            height: multiline ? 100 : (settings.largeTouchTargets ? 56 : 48),
            fontWeight: settings.boldText ? '500' : 'normal'
          }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        editable={editable}
        accessible={true}
        accessibilityLabel={accessibilityLabel || `${label} input field`}
        accessibilityRole="none"
        onFocus={() => {
          if (settings.audioFeedback) {
            speak(`Editing ${label}`);
          }
        }}
      />
    </View>
  );
};

// Accessible Card Component
export const AccessibleCard: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  title?: string;
  subtitle?: string;
  accessibilityLabel?: string;
}> = ({ children, onPress, title, subtitle, accessibilityLabel }) => {
  const { getColors, playSound } = useAccessibility();
  const colors = getColors();

  const handlePress = () => {
    if (onPress) {
      playSound('click');
      onPress();
    }
  };

  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }
      ]}
      onPress={onPress ? handlePress : undefined}
      accessible={!!onPress}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole={onPress ? "button" : "none"}
    >
      {children}
    </CardWrapper>
  );
};

// Floating Help Button
export const FloatingHelpButton: React.FC = () => {
  const { settings, getColors, speak, playSound } = useAccessibility();
  const colors = getColors();

  if (!settings.tutorialMode) return null;

  const handleHelp = () => {
    playSound('click');
    speak('Help is available. You can ask for guidance on any screen.');
    // In production, this would show contextual help
  };

  return (
    <TouchableOpacity
      style={[
        styles.floatingHelpButton,
        { backgroundColor: colors.warning }
      ]}
      onPress={handleHelp}
      accessible={true}
      accessibilityLabel="Get help with this screen"
      accessibilityRole="button"
    >
      <Ionicons name="help" size={24} color="white" />
    </TouchableOpacity>
  );
};

// Voice Command Button
export const VoiceCommandButton: React.FC = () => {
  const { settings, getColors, speak, playSound } = useAccessibility();
  const colors = getColors();

  if (!settings.voiceCommands) return null;

  const handleVoiceCommand = () => {
    playSound('click');
    speak('Voice commands ready. Say go home, scan item, or help.');
    // Voice recognition would start here
  };

  return (
    <TouchableOpacity
      style={[
        styles.voiceCommandButton,
        { backgroundColor: colors.primary }
      ]}
      onPress={handleVoiceCommand}
      accessible={true}
      accessibilityLabel="Start voice commands"
      accessibilityRole="button"
    >
      <Ionicons name="mic" size={20} color="white" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  breadcrumbContainer: {
    marginBottom: 8,
  },
  breadcrumb: {
    fontStyle: 'italic',
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  headerTitle: {
    textAlign: 'center',
  },
  accessibleButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    textAlign: 'center',
  },
  inputContainer: {
    marginVertical: 12,
  },
  inputLabel: {
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  floatingHelpButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  voiceCommandButton: {
    position: 'absolute',
    bottom: 170,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
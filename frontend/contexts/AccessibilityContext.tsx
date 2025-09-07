import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccessibilitySettings {
  // Visual Settings
  textSize: 'normal' | 'large' | 'extra-large';
  highContrast: boolean;
  largeTouchTargets: boolean;
  boldText: boolean;
  
  // Audio Settings (placeholders for now)
  audioFeedback: boolean;
  voiceCommands: boolean;
  readAloud: boolean;
  
  // Navigation Settings
  showBreadcrumbs: boolean;
  bigButtonMode: boolean;
  simplifiedUI: boolean;
  
  // Assistance Settings
  tutorialMode: boolean;
  smartSuggestions: boolean;
  confirmationDialogs: boolean;
  
  // Personal Settings
  favoriteItems: string[];
  recentItems: string[];
  preferredUser: string | null;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  speak: (text: string) => void;
  playSound: (type: 'success' | 'error' | 'warning' | 'click') => void;
  addToFavorites: (itemId: string, itemName: string) => void;
  removeFromFavorites: (itemId: string) => void;
  addToRecent: (itemId: string, itemName: string) => void;
  getTextSize: () => number;
  getButtonSize: () => number;
  getColors: () => ColorTheme;
}

interface ColorTheme {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  success: string;
  warning: string;
  error: string;
  border: string;
}

const defaultSettings: AccessibilitySettings = {
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
  favoriteItems: [],
  recentItems: [],
  preferredUser: null,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('accessibility_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<AccessibilitySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      await AsyncStorage.setItem('accessibility_settings', JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  };

  const speak = (text: string) => {
    // For now, just log to console
    if (settings.audioFeedback || settings.readAloud) {
      console.log('🗣️ Speak:', text);
    }
  };

  const playSound = async (type: 'success' | 'error' | 'warning' | 'click') => {
    // For now, just log to console
    if (settings.audioFeedback) {
      console.log('🔊 Sound:', type);
    }
  };

  const addToFavorites = (itemId: string, itemName: string) => {
    const newFavorites = [...settings.favoriteItems];
    if (!newFavorites.includes(itemId)) {
      newFavorites.push(itemId);
      updateSettings({ favoriteItems: newFavorites });
      speak(`${itemName} added to favorites`);
    }
  };

  const removeFromFavorites = (itemId: string) => {
    const newFavorites = settings.favoriteItems.filter(id => id !== itemId);
    updateSettings({ favoriteItems: newFavorites });
    speak('Removed from favorites');
  };

  const addToRecent = (itemId: string, itemName: string) => {
    const newRecent = [itemId, ...settings.recentItems.filter(id => id !== itemId)].slice(0, 10);
    updateSettings({ recentItems: newRecent });
  };

  const getTextSize = (): number => {
    switch (settings.textSize) {
      case 'large': return 22;
      case 'extra-large': return 28;
      default: return 18;
    }
  };

  const getButtonSize = (): number => {
    if (settings.largeTouchTargets || settings.bigButtonMode) {
      return 64;
    }
    return 48;
  };

  const getColors = (): ColorTheme => {
    if (settings.highContrast) {
      return {
        background: '#000000',
        surface: '#1a1a1a',
        text: '#FFFFFF',
        textSecondary: '#FFFF00', // Yellow for high visibility
        primary: '#00FF00', // Bright green
        success: '#00FF00',
        warning: '#FFFF00',
        error: '#FF0000',
        border: '#FFFFFF',
      };
    }
    
    return {
      background: '#1a1a1a',
      surface: '#2d2d2d',
      text: '#FFFFFF',
      textSecondary: '#CCCCCC',
      primary: '#4CAF50',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      border: '#404040',
    };
  };

  const contextValue: AccessibilityContextType = {
    settings,
    updateSettings,
    speak,
    playSound,
    addToFavorites,
    removeFromFavorites,
    addToRecent,
    getTextSize,
    getButtonSize,
    getColors,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Voice Command Handler (placeholder for now)
export const VoiceCommandHandler = {
  commands: {
    'go home': () => { console.log('Voice: Go home'); },
    'scan item': () => { console.log('Voice: Scan item'); },
    'add delivery': () => { console.log('Voice: Add delivery'); },
    'show inventory': () => { console.log('Voice: Show inventory'); },
    'help': () => { console.log('Voice: Help'); },
  },
  
  startListening: () => {
    console.log('Voice recognition started');
  },
  
  stopListening: () => {
    console.log('Voice recognition stopped');
  }
};
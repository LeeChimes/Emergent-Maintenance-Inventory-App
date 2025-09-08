import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface UniversalHeaderProps {
  title: string;
  showBackButton?: boolean;
}

export default function UniversalHeader({ title, showBackButton = true }: UniversalHeaderProps) {
  const handleScanPress = () => {
    // Go directly to scanner screen which will open camera
    router.push('/scanner');
  };

  const handleHomePress = () => {
    // Always go to main dashboard
    router.push('/');
  };

  const handleHelpPress = () => {
    // Go directly to help & support
    router.push('/help');
  };

  const handleBackPress = () => {
    // Go back to main dashboard
    router.push('/');
  };

  return (
    <View style={styles.header}>
      {/* Left side - Back button or spacer */}
      <View style={styles.leftSection}>
        {showBackButton ? (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      {/* Center - Title */}
      <View style={styles.centerSection}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {/* Right side - Help, Home, Scan buttons */}
      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleHelpPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="help-circle" size={22} color="#2196F3" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleHomePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="home" size={22} color="#4CAF50" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleScanPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="qr-code-scan" size={22} color="#FF9800" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2d2d2d',
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
    minHeight: 60,
  },
  leftSection: {
    width: 60,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    width: 140,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
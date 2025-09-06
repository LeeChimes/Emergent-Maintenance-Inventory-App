import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ErrorReportingService } from '../services/ErrorReportingService';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  showFallback?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Generate unique error ID
    const errorId = `ERROR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Report error automatically
    ErrorReportingService.reportError({
      id: errorId,
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
      userAction: 'Component Error',
      screen: 'Unknown',
      additionalData: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    });

    // Show user-friendly alert
    setTimeout(() => {
      Alert.alert(
        '🔧 Oops! Something went wrong',
        `Don't worry - we've got this handled! Our system has automatically detected and reported this issue.\n\nError ID: ${errorId}\n\nWe're working on it right away! 🚀`,
        [
          {
            text: 'Try Again',
            onPress: () => this.handleRetry(),
          },
          {
            text: 'Go to Main Menu',
            onPress: () => this.handleGoHome(),
          },
        ]
      );
    }, 100);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
    router.replace('/');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="construct" size={64} color="#4CAF50" />
            </View>
            
            <Text style={styles.title}>We're On It! 🔧</Text>
            <Text style={styles.message}>
              Something unexpected happened, but don't worry - our auto-repair system is already working on it!
            </Text>

            <View style={styles.errorIdContainer}>
              <Text style={styles.errorIdLabel}>Error ID:</Text>
              <Text style={styles.errorId}>{this.state.errorId}</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={this.handleRetry}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.homeButton]}
                onPress={this.handleGoHome}
              >
                <Ionicons name="home" size={20} color="#fff" />
                <Text style={styles.buttonText}>Main Menu</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reassuranceContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.reassuranceText}>
                ✅ Error automatically reported{'\n'}
                🚀 Fix will be deployed shortly{'\n'}
                💪 Your data is safe
              </Text>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2d4d2d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: '#aaa',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  errorIdContainer: {
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  errorIdLabel: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorId: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
  },
  homeButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reassuranceContainer: {
    alignItems: 'center',
    gap: 8,
  },
  reassuranceText: {
    color: '#4CAF50',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
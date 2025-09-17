// frontend/app/components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  children: ReactNode;
  /** Optional custom UI to show when an error is caught */
  fallbackComponent?: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // You can hook this to your logging/monitoring later
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallbackComponent ?? (
          <View style={styles.wrap}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.sub}>Please try again.</Text>
          </View>
        )
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    padding: 16,
    backgroundColor: '#2d2d2d',
    borderRadius: 8,
    margin: 10,
  },
  title: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  sub: {
    color: '#aaa',
    fontSize: 14,
  },
});

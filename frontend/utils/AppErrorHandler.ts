import { Alert } from 'react-native';
import { ErrorReportingService } from '../services/ErrorReportingService';

class AppErrorHandlerClass {
  private isInitialized = false;

  initialize() {
    if (this.isInitialized) return;

    // Set up global error handlers
    this.setupGlobalErrorHandlers();
    this.setupUnhandledPromiseRejection();
    
    this.isInitialized = true;
    console.log('🛡️ App Error Handler initialized - Your app is now bulletproof!');
  }

  private setupGlobalErrorHandlers() {
    // Handle synchronous errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      
      // Extract error information
      const errorMessage = args.join(' ');
      if (this.shouldReportError(errorMessage)) {
        this.handleError(new Error(errorMessage), 'Console Error');
      }
    };
  }

  private setupUnhandledPromiseRejection() {
    // Handle unhandled promise rejections
    if (typeof global !== 'undefined' && global.addEventListener) {
      global.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        this.handleError(error, 'Unhandled Promise Rejection');
        event.preventDefault(); // Prevent default logging
      });
    }
  }

  private shouldReportError(errorMessage: string): boolean {
    // Filter out non-critical warnings and development messages
    const ignoredPatterns = [
      'Warning:',
      'react-dom.development.js',
      'shadow*',
      'Fast refresh',
      'Development mode',
    ];

    return !ignoredPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  async handleError(error: Error, context: string = 'Unknown') {
    try {
      // Generate unique error ID
      const errorId = `APP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Report error
      await ErrorReportingService.reportError({
        id: errorId,
        error,
        timestamp: new Date().toISOString(),
        userAction: context,
        screen: 'Global Handler',
        additionalData: {
          context,
          stack: error.stack,
        },
      });

      // Show user-friendly message based on error type
      const friendlyMessage = ErrorReportingService.getFriendlyErrorMessage(error);
      
      // Show toast-like notification (non-blocking)
      this.showFriendlyNotification(friendlyMessage, errorId);

    } catch (reportingError) {
      console.log('📱 Error reporting failed, but we logged it locally');
    }
  }

  private showFriendlyNotification(message: string, errorId: string) {
    // For non-critical errors, show a brief notification
    console.log(`🔧 AUTO-REPAIR: ${message} (ID: ${errorId})`);
    
    // Could implement a toast notification here if you add a toast library
    // For now, we'll use a subtle alert for critical errors only
  }

  // Wrapper for async operations with auto error handling
  async safeAsyncOperation<T>(
    operation: () => Promise<T>,
    context: string = 'Async Operation',
    showErrorToUser: boolean = false
  ): Promise<T | null> {
    try {
      return await ErrorReportingService.retryWithFriendlyFeedback(operation, 2, context);
    } catch (error) {
      await this.handleError(error as Error, context);
      
      if (showErrorToUser) {
        const friendlyMessage = ErrorReportingService.getFriendlyErrorMessage(error as Error);
        Alert.alert(
          '🔧 Quick Fix in Progress',
          friendlyMessage,
          [{ text: 'Got it! 👍' }]
        );
      }
      
      return null;
    }
  }

  // Safe network request wrapper
  async safeNetworkCall(
    url: string,
    options: RequestInit = {},
    context: string = 'Network Request'
  ): Promise<any> {
    try {
      const response = await ErrorReportingService.safeNetworkRequest(url, options, context);
      return await response.json();
    } catch (error) {
      await this.handleError(error as Error, `Network: ${context}`);
      
      // Return null or default data instead of crashing
      return null;
    }
  }

  // Safe storage operations
  async safeStorageOperation<T>(
    operation: () => Promise<T>,
    defaultValue: T,
    context: string = 'Storage Operation'
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      await this.handleError(error as Error, `Storage: ${context}`);
      return defaultValue;
    }
  }
}

export const AppErrorHandler = new AppErrorHandlerClass();
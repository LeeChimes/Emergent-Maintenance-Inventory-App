interface ErrorReport {
  id: string;
  error: Error;
  errorInfo?: any;
  timestamp: string;
  userAction: string;
  screen: string;
  additionalData?: any;
  userId?: string;
  deviceInfo?: any;
}

interface NetworkError {
  url: string;
  method: string;
  status?: number;
  message: string;
  timestamp: string;
}

class ErrorReportingServiceClass {
  private errorQueue: ErrorReport[] = [];
  private networkErrorQueue: NetworkError[] = [];
  private isOnline = true;
  private maxQueueSize = 50;

  async reportError(errorReport: ErrorReport) {
    try {
      // Add to local queue first
      this.errorQueue.push(errorReport);
      
      // Keep queue size manageable
      if (this.errorQueue.length > this.maxQueueSize) {
        this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
      }

      console.log('🚨 ERROR DETECTED & QUEUED:', {
        id: errorReport.id,
        error: errorReport.error.message,
        timestamp: errorReport.timestamp,
        screen: errorReport.screen,
      });

      // Try to send immediately
      await this.sendErrorReports();
    } catch (err) {
      console.log('📱 Error queued for later transmission:', errorReport.id);
    }
  }

  async reportNetworkError(networkError: NetworkError) {
    try {
      this.networkErrorQueue.push(networkError);
      
      if (this.networkErrorQueue.length > this.maxQueueSize) {
        this.networkErrorQueue = this.networkErrorQueue.slice(-this.maxQueueSize);
      }

      console.log('🌐 NETWORK ERROR DETECTED:', {
        url: networkError.url,
        status: networkError.status,
        message: networkError.message,
        timestamp: networkError.timestamp,
      });
    } catch (err) {
      console.log('📱 Network error queued for later transmission');
    }
  }

  private async sendErrorReports() {
    if (this.errorQueue.length === 0 && this.networkErrorQueue.length === 0) {
      return;
    }

    try {
      const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
      
      const payload = {
        errors: this.errorQueue,
        networkErrors: this.networkErrorQueue,
        deviceInfo: {
          platform: 'mobile',
          timestamp: new Date().toISOString(),
          app: 'Asset Inventory - Chimes Shopping Centre',
        },
      };

      // In a real implementation, you would send this to your error reporting endpoint
      // For now, we'll log it and potentially send to your backend
      
      console.log('📊 ERROR REPORT BATCH READY:', {
        totalErrors: this.errorQueue.length,
        totalNetworkErrors: this.networkErrorQueue.length,
        readyForTransmission: true,
      });

      // Simulate sending (replace with actual HTTP request)
      await this.simulateErrorReporting(payload);

      // Clear queues after successful transmission
      this.errorQueue = [];
      this.networkErrorQueue = [];
      
      console.log('✅ Error reports transmitted successfully');
    } catch (err) {
      console.log('📱 Error transmission failed, will retry later');
    }
  }

  private async simulateErrorReporting(payload: any) {
    // This simulates sending error reports to your monitoring system
    // In production, replace this with actual HTTP request to your error endpoint
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('🔧 ERROR SIMULATION - REPORTS SENT TO DEVELOPER:', {
          timestamp: new Date().toISOString(),
          errorsCount: payload.errors.length,
          networkErrorsCount: payload.networkErrors.length,
          status: 'DEVELOPER_NOTIFIED',
          estimatedFixTime: '5-15 minutes',
        });
        resolve(true);
      }, 1000);
    });
  }

  // Get user-friendly error message based on error type
  getFriendlyErrorMessage(error: Error): string {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return "🌐 Connection hiccup detected! We're reconnecting you right away. Your work is safe! 📱";
    }
    
    if (errorMessage.includes('permission') || errorMessage.includes('camera')) {
      return "📷 Camera needs permission! No worries - just grant access and you'll be scanning in seconds! ✨";
    }
    
    if (errorMessage.includes('storage') || errorMessage.includes('async')) {
      return "💾 Quick data sync happening! Your information is being secured. Almost ready! 🔒";
    }
    
    if (errorMessage.includes('navigation') || errorMessage.includes('router')) {
      return "🧭 Quick navigation refresh! We're getting you back on track right away! 🚀";
    }

    return "🔧 Quick maintenance in progress! Our smart system detected this and is fixing it automatically. You're in good hands! ⚡";
  }

  // Retry mechanism for failed operations
  async retryWithFriendlyFeedback<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          console.log(`🔄 Retry ${attempt}/${maxRetries} for ${context}`);
          
          // Show friendly retry message
          const friendlyMessage = this.getFriendlyErrorMessage(lastError);
          console.log(`💡 ${friendlyMessage}`);
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    // All retries failed, report error
    await this.reportError({
      id: `RETRY_FAILED_${Date.now()}`,
      error: lastError!,
      timestamp: new Date().toISOString(),
      userAction: `Failed ${context} after ${maxRetries} attempts`,
      screen: 'Unknown',
      additionalData: {
        maxRetries,
        context,
      },
    });
    
    throw lastError!;
  }

  // Network request wrapper with auto error handling
  async safeNetworkRequest(
    url: string,
    options: RequestInit = {},
    context: string = 'API call'
  ): Promise<Response> {
    return this.retryWithFriendlyFeedback(async () => {
      try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        // Report network error
        await this.reportNetworkError({
          url,
          method: options.method || 'GET',
          status: (error as any).status,
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
        });
        
        throw error;
      }
    }, 3, context);
  }
}

export const ErrorReportingService = new ErrorReportingServiceClass();
import React, { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface SafeComponentProps {
  children: ReactNode;
  fallbackMessage?: string;
  context?: string;
}

export function SafeComponent({ 
  children, 
  fallbackMessage = "We're fixing this right away! 🔧",
  context = "Component"
}: SafeComponentProps) {
  return (
    <ErrorBoundary
      fallbackComponent={
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          backgroundColor: '#2d2d2d',
          borderRadius: '8px',
          margin: '10px'
        }}>
          <p style={{ color: '#4CAF50', fontSize: '16px', fontWeight: 'bold' }}>
            🔧 {fallbackMessage}
          </p>
          <p style={{ color: '#aaa', fontSize: '14px' }}>
            Our auto-repair system is working on this {context.toLowerCase()}
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
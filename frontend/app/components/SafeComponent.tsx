// frontend/app/components/SafeComponent.tsx
import React, { ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface Props {
  children: ReactNode;
}

/**
 * Wraps any children with the app-wide ErrorBoundary.
 * Keeps this component ultra-simple so it's safe to use anywhere.
 */
export default function SafeComponent({ children }: Props) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

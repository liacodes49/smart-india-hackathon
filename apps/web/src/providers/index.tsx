'use client';
import React from 'react';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Wraps the app with all necessary providers.
 * Add TanStack Query, Auth, Theme providers here.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <>
      {/* TODO: Add QueryClientProvider, AuthProvider, ThemeProvider */}
      {children}
    </>
  );
}

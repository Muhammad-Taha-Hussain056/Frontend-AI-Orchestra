'use client';
import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from './query-client';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;   // do NOT useState-create on the client without the singleton
}

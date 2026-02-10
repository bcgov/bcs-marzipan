// src/index.tsx
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { CookiesProvider } from 'react-cookie';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { StrictMode } from 'react';

import { ApiError } from './api/errors';
import App from './App';
import { createLogger } from './lib/logger';

import './styles/globals.css';

const logger = createLogger('ReactQuery');

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError) {
        logger.error(
          `Query error [${error.correlationId}]: ${error.detail}`,
          error
        );
      } else {
        logger.error('Query error', error);
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof ApiError) {
        logger.error(
          `Mutation error [${error.correlationId}]: ${error.detail}`,
          error
        );
      } else {
        logger.error('Mutation error', error);
      }
      // Note: Toast notifications should be handled at component level
      // using the showErrorToast helper from lib/error-toast
    },
  }),
  defaultOptions: {
    queries: {
      // Retry logic: don't retry 4xx errors, retry 5xx and network errors
      retry: (failureCount, error) => {
        // Don't retry client errors (4xx)
        if (error instanceof ApiError && error.isClientError()) {
          return false;
        }
        // Retry up to 3 times for server errors and network errors
        return failureCount < 3;
      },
      // Retry delay: exponential backoff (1s, 2s, 4s)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Stale time: consider data fresh for 30 seconds
      staleTime: 30_000,
      // Cache time: keep unused data for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Refetch on window focus in production (helpful for keeping data fresh)
      refetchOnWindowFocus: import.meta.env.PROD,
    },
    mutations: {
      // Retry mutations once for network errors only
      retry: (failureCount, error) => {
        // Don't retry client errors
        if (error instanceof ApiError && error.isClientError()) {
          return false;
        }
        // Retry once for server errors and network errors
        return failureCount < 1;
      },
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CookiesProvider>
          <App />
        </CookiesProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);

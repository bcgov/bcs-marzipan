// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CookiesProvider } from 'react-cookie';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles/globals.css';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <CookiesProvider>
        <App />
      </CookiesProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

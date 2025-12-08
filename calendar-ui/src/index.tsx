// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CookiesProvider } from 'react-cookie';
import './styles/globals.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <BrowserRouter>
    <CookiesProvider>
      <App />
    </CookiesProvider>
  </BrowserRouter>
);

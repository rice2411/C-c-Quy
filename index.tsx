import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './styles.css'; // Tailwind (build-time) + design tokens

const GOOGLE_CLIENT_ID: string = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

// Clean up cache busting query params from URL
if (typeof window !== 'undefined') {
  const url = new URL(window.location.href);
  const hasCacheBustingParams = url.searchParams.has('t') || url.searchParams.has('_sw-precache');
  
  if (hasCacheBustingParams) {
    // Remove cache busting params
    url.searchParams.delete('t');
    url.searchParams.delete('_sw-precache');
    
    // Replace URL without cache busting params
    window.history.replaceState({}, '', url.pathname + url.hash);
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
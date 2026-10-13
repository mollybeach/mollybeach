// path: src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// mollybeach.app/mac opens the iMac in the library (vercel.json redirects it;
// this catches it wherever the redirect doesn't run, like the dev server)
if (window.location.pathname.replace(/\/$/, '') === '/mac') {
  window.history.replaceState(null, '', '/#library/mac');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

reportWebVitals();
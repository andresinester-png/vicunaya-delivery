import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA support and push notifications.
// updateViaCache: 'none' makes the browser always fetch a fresh sw.js from
// the network instead of serving a cached copy, so updates are picked up
// as soon as they're deployed.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(registration => registration.update())
      .catch(err => console.error('[SW] Registration failed:', err));

    // Reload once the new service worker (skipWaiting + clientsClaim) takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  });
}

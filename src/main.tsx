import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ensureFirestoreInitialized } from './services/firestoreService';

// Initialize cloud Firestore collections with baseline data on app launch
ensureFirestoreInitialized().catch(err => {
  console.warn('Firestore initial boot sync:', err);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


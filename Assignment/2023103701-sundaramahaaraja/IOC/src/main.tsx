import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../careerpilot_ai';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

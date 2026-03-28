import { enableMapSet } from 'immer';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Immer needs this plugin to handle Map and Set in state
enableMapSet();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

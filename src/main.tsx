import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import { settings } from './lib/settings';
settings.apply();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><HashRouter><App /></HashRouter></React.StrictMode>,
);

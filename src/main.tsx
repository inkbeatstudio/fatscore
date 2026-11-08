import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './styles/app.css';
import App from './App';
import { initStore } from './store';

registerSW({ immediate: true });

initStore().finally(() => {
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
});

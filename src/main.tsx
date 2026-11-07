import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from '@/components/AuthProvider';
import { initNative } from '@/lib/native';
import '@fontsource/plus-jakarta-sans/latin-400.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/plus-jakarta-sans/latin-800.css';
import '@fontsource/sora/latin-600.css';
import '@fontsource/sora/latin-700.css';
import '@fontsource/sora/latin-800.css';
import './index.css';

void initNative();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

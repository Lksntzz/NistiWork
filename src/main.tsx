import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        gutter={10}
        toastOptions={{
          duration: 3200,
          style: {
            background: '#18181b',
            color: '#fafafa',
            border: '1px solid #27272a',
            borderRadius: '12px',
            boxShadow: '0 18px 45px rgba(0, 0, 0, 0.28)',
          },
          success: {
            iconTheme: {
              primary: '#34d399',
              secondary: '#18181b',
            },
          },
          error: {
            duration: 4500,
            iconTheme: {
              primary: '#f87171',
              secondary: '#18181b',
            },
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { raise } from '@node-typescript-monorepo-template/utils';

import App from './pages/App/App.tsx';
import './index.scss';

const container = document.getElementById('root') ?? raise(new Error('Could not find root element.'));
const root = ReactDOM.createRoot(container);

const queryClient = new QueryClient();

root.render(<>
  <QueryClientProvider client={queryClient}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
    <ReactQueryDevtools />
  </QueryClientProvider>
</>);

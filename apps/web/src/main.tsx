import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routeTree } from './routes';
import { AuthProvider, useAuth } from './lib/auth';
import { Toaster } from './components';
import '@fontsource-variable/geist';
import '@fontsource-variable/jetbrains-mono';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!,
  },
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppInner() {
  const auth = useAuth();

  return (
    <>
      <RouterProvider router={router} context={{ queryClient, auth }} />
      <Toaster />
    </>
  );
}

function App() {
  // QueryClientProvider wraps AuthProvider so auth transitions can clear the
  // query cache (prevents one user's cached data leaking into the next session).
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </QueryClientProvider>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

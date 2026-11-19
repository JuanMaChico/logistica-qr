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

function RouteError({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-bold text-foreground">Algo salió mal</h1>
      <p className="max-w-md text-sm text-muted-foreground">{error.message}</p>
      <button
        onClick={() => window.location.assign('/')}
        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Volver al inicio
      </button>
    </div>
  );
}

function RouteNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-bold text-foreground">404</h1>
      <p className="text-sm text-muted-foreground">La página que buscás no existe.</p>
      <button
        onClick={() => window.location.assign('/')}
        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Volver al inicio
      </button>
    </div>
  );
}

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!,
  },
  defaultPreload: 'intent',
  defaultErrorComponent: RouteError,
  defaultNotFoundComponent: RouteNotFound,
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

import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { isEnabled } from '@tokin/api-client';
import OrdersPage from '../components/OrdersPage';

export interface RouterContext {
  queryClient: QueryClient;
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Tokin Dashboard</h1>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <div className="text-center py-20">
      <h2 className="text-2xl font-semibold text-gray-700">Welcome to Tokin Dashboard</h2>
      <p className="mt-2 text-gray-500">Select a section from the navigation.</p>
    </div>
  ),
});

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders',
  beforeLoad: () => {
    if (!isEnabled('orders.enabled')) {
      throw new Error('Feature not available');
    }
  },
  component: () => <OrdersPage />,
});

const routeTree = rootRoute.addChildren([indexRoute, ordersRoute]);

const router = createRouter({
  routeTree,
  context: { queryClient: undefined! },
});

export { router, routeTree };

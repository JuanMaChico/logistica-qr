import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type { AuthContextValue } from '../lib/auth';

export interface RouterContext {
  queryClient: QueryClient;
  auth: AuthContextValue;
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});

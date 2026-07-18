import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { HttpHandler } from 'msw';
import { useOrdersQuery } from '../useOrdersQuery';
import type { ReactNode } from 'react';

const handlers: HttpHandler[] = [
  http.get('*/api/orders', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'ORD-001',
          customerName: 'Test User',
          email: 'test@example.com',
          total: 100.00,
          status: 'delivered',
          createdAt: '2026-06-15T10:00:00Z',
          items: 3,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
    });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useOrdersQuery', () => {
  it('returns orders data on success', async () => {
    const { result } = renderHook(() => useOrdersQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0]?.id).toBe('ORD-001');
  });
});

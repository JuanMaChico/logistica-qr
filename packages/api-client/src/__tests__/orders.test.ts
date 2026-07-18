import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { HttpHandler } from 'msw';
import { getOrders, getOrderById } from '../adapters/orders';

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

  http.get('*/api/orders/:id', ({ params }: { params: Record<string, string> }) => {
    return HttpResponse.json({
      id: params['id'],
      customerName: 'Test User',
      email: 'test@example.com',
      total: 100.00,
      status: 'delivered',
      createdAt: '2026-06-15T10:00:00Z',
      items: 3,
    });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());

describe('orders adapter', () => {
  it('getOrders returns paginated response', async () => {
    const response = await getOrders();
    expect(response.data).toHaveLength(1);
    expect(response.data[0]?.id).toBe('ORD-001');
    expect(response.data[0]?.customerName).toBe('Test User');
  });

  it('getOrderById returns a single order', async () => {
    const order = await getOrderById('ORD-001');
    expect(order.id).toBe('ORD-001');
    expect(order.total).toBe(100.00);
    expect(order.status).toBe('delivered');
  });
});

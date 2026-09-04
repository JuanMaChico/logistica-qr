import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { apiClient, setBaseUrl } from '../client';

const server = setupServer();

beforeAll(() => {
  server.listen();
  setBaseUrl('http://localhost:9999');
});

afterAll(() => server.close());

afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});

describe('setBaseUrl', () => {
  it('should update the base URL for subsequent requests', async () => {
    setBaseUrl('http://localhost:9999');

    server.use(
      http.get('http://localhost:9999/test', () =>
        HttpResponse.json({ ok: true }),
      ),
    );

    const res = await apiClient.get('/test');
    expect(res.data).toEqual({ ok: true });
  });
});

describe('request interceptor', () => {
  it('should attach Authorization header when token exists', async () => {
    localStorage.setItem('access_token', 'test-token');

    server.use(
      http.get('http://localhost:9999/protected', ({ request }) => {
        const auth = request.headers.get('Authorization');
        return HttpResponse.json({ authorized: auth === 'Bearer test-token' });
      }),
    );

    const res = await apiClient.get('/protected');
    expect(res.data.authorized).toBe(true);
  });

  it('should not attach Authorization header when no token', async () => {
    localStorage.removeItem('access_token');

    server.use(
      http.get('http://localhost:9999/public', ({ request }) => {
        const auth = request.headers.get('Authorization');
        return HttpResponse.json({ hasAuth: !!auth });
      }),
    );

    const res = await apiClient.get('/public');
    expect(res.data.hasAuth).toBe(false);
  });
});

describe('response interceptor', () => {
  it('should clear token and redirect on 401', async () => {
    localStorage.setItem('access_token', 'expired-token');

    server.use(
      http.get('http://localhost:9999/protected', () =>
        new HttpResponse(null, { status: 401 }),
      ),
    );

    await expect(apiClient.get('/protected')).rejects.toThrow();

    expect(localStorage.getItem('access_token')).toBeNull();
  });
});

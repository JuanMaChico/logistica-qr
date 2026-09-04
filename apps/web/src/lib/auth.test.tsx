import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth';

vi.mock('@logistica/sdk', () => ({
  login: vi.fn(),
  pinLogin: vi.fn(),
  register: vi.fn(),
}));

import * as sdk from '@logistica/sdk';

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

function renderAuthHook() {
  return renderHook(() => useAuth(), {
    wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
  });
}

describe('AuthProvider', () => {
  it('should start unauthenticated', () => {
    const { result } = renderAuthHook();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('should login successfully', async () => {
    const mockResponse = { token: 'jwt', user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'owner' as const, phone: null, orgId: 'o1', createdAt: new Date().toISOString() } };
    vi.mocked(sdk.login).mockResolvedValue(mockResponse);

    const { result } = renderAuthHook();

    await act(async () => {
      const res = await result.current.login('admin@test.com', '123456');
      expect(res.token).toBe('jwt');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.name).toBe('Admin');
    expect(localStorage.getItem('access_token')).toBe('jwt');
  });

  it('should pinLogin successfully', async () => {
    const mockResponse = { token: 'jwt-pin', user: { id: 'u2', name: 'Técnico', email: null, role: 'technician' as const, phone: '123', orgId: 'o1', createdAt: new Date().toISOString() } };
    vi.mocked(sdk.pinLogin).mockResolvedValue(mockResponse);

    const { result } = renderAuthHook();

    await act(async () => {
      await result.current.pinLogin('1234');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.role).toBe('technician');
  });

  it('should register successfully', async () => {
    const mockResponse = { token: 'jwt-reg', user: { id: 'u1', name: 'Admin', email: 'a@b.com', role: 'owner' as const, phone: null, orgId: 'o1', createdAt: new Date().toISOString() } };
    vi.mocked(sdk.register).mockResolvedValue(mockResponse);

    const { result } = renderAuthHook();

    await act(async () => {
      await result.current.register({ organizationName: 'Org', slug: 'org', name: 'Admin', email: 'a@b.com', password: '123456' });
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should logout and clear state', async () => {
    localStorage.setItem('access_token', 'jwt');
    localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'owner', phone: null, orgId: 'o1', createdAt: new Date().toISOString() }));

    const { result } = renderAuthHook();

    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('should restore session from localStorage', () => {
    localStorage.setItem('access_token', 'jwt-existing');
    localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'owner', phone: null, orgId: 'o1', createdAt: new Date().toISOString() }));

    const { result } = renderAuthHook();

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('jwt-existing');
  });

  it('should throw when useAuth is used outside provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider');
  });
});

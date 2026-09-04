import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { login as sdkLogin, pinLogin as sdkPinLogin, register as sdkRegister } from '@logistica/sdk';
import type { User, RegisterInput } from '@logistica/types';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  pinLogin: (pin: string) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  logout: () => void;
}

export interface AuthResult {
  token: string;
  user: User;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStored(): { user: User | null; token: string | null } {
  try {
    return {
      token: localStorage.getItem('access_token'),
      user: JSON.parse(localStorage.getItem('user') ?? 'null'),
    };
  } catch {
    return { user: null, token: null };
  }
}

function persist(token: string, user: User): void {
  localStorage.setItem('access_token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clear(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = useMemo(getStored, []);
  const [user, setUser] = useState<User | null>(stored.user);
  const [token, setToken] = useState<string | null>(stored.token);
  const queryClient = useQueryClient();

  const login = useCallback(async (email: string, password: string) => {
    const res = await sdkLogin({ email, password });
    persist(res.token, res.user);
    // Drop any cached data from a previous session before the new user's
    // queries run (otherwise e.g. the event-count badge shows the prior user's).
    queryClient.clear();
    // flushSync forces the router's context to pick up the new auth state
    // before the caller's navigate() runs — otherwise beforeLoad guards read
    // stale (unauthenticated) context and bounce back to /login.
    flushSync(() => {
      setToken(res.token);
      setUser(res.user);
    });
    return res;
  }, [queryClient]);

  const pinLogin = useCallback(async (pin: string) => {
    const res = await sdkPinLogin({ pin });
    persist(res.token, res.user);
    queryClient.clear();
    flushSync(() => {
      setToken(res.token);
      setUser(res.user);
    });
    return res;
  }, [queryClient]);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await sdkRegister(input);
    persist(res.token, res.user);
    queryClient.clear();
    flushSync(() => {
      setToken(res.token);
      setUser(res.user);
    });
    return res;
  }, [queryClient]);

  const logout = useCallback(() => {
    clear();
    queryClient.clear();
    flushSync(() => {
      setToken(null);
      setUser(null);
    });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: !!user && !!token,
    login,
    pinLogin,
    register,
    logout,
  }), [user, token, login, pinLogin, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

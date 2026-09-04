import { apiClient } from '../client';
import type { AuthResponse, LoginCredentials, PinLogin, RegisterInput } from '@logistica/types';

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', input);
  return data;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
  return data;
}

export async function pinLogin(credentials: PinLogin): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/pin-login', credentials);
  return data;
}

export async function getProfile() {
  const { data } = await apiClient.get('/auth/profile');
  return data;
}

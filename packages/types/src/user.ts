export type Role = 'owner' | 'technician';

export interface User {
  id: string;
  name: string;
  email: string | null;
  role: Role;
  phone: string | null;
  orgId: string;
  createdAt: string;
}

export interface CreateUser {
  name: string;
  email?: string;
  pin?: string;
  role: Role;
  phone?: string;
}

export interface RegisterInput {
  organizationName: string;
  slug: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PinLogin {
  pin: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

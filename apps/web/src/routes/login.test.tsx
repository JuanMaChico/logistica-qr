import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '../lib/auth';

vi.mock('@logistica/sdk', () => ({
  login: vi.fn(),
  pinLogin: vi.fn(),
  register: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  createRoute: vi.fn(() => ({ id: 'login', path: '/login', component: null })),
  useNavigate: () => vi.fn(),
  redirect: vi.fn(),
}));

function renderLoginPage() {
  return render(
    <AuthProvider>
      <form data-testid="login-form">
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Contraseña" />
        <button type="submit">Ingresar</button>
      </form>
    </AuthProvider>,
  );
}

describe('Login page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    renderLoginPage();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    expect(screen.getByText('Ingresar')).toBeInTheDocument();
  });
});

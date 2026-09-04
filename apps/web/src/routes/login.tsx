import { useState, useRef } from 'react';
import { createRoute, useNavigate, redirect } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { useAuth } from '../lib/auth';

function LoginPage() {
  const [tab, setTab] = useState<'owner' | 'tech'>('owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.login(email, password);
      navigate({ to: '/' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleTechLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await auth.pinLogin(pin.join(''));
      navigate({ to: '/' });
    } catch {
      setError('PIN incorrecto');
    } finally {
      setLoading(false);
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-[380px] px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--scan)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
              <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
          </div>
          <h1 className="text-[22px] font-extrabold tracking-tight">Logística QR</h1>
          <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">Control de inventario con check-in/out</p>
        </div>

        <div className="mb-6 flex gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-0.5">
          <button
            onClick={() => { setTab('owner'); setError(''); }}
            className={`flex-1 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors ${
              tab === 'owner' ? 'bg-[var(--accent-dim)] text-[var(--accent)]' : 'text-[var(--text-muted)]'
            }`}
          >
            Dueño
          </button>
          <button
            onClick={() => { setTab('tech'); setError(''); }}
            className={`flex-1 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-colors ${
              tab === 'tech' ? 'bg-[var(--accent-dim)] text-[var(--accent)]' : 'text-[var(--text-muted)]'
            }`}
          >
            Técnico
          </button>
        </div>

        {tab === 'owner' && (
          <form onSubmit={handleOwnerLogin} className="flex flex-col gap-3.5">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-[14px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-dim)] focus:border-[var(--accent)]"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-3 text-[14px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-dim)] focus:border-[var(--accent)]"
            />
            {error && <p className="text-center text-[12px] text-[var(--red)]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        )}

        {tab === 'tech' && (
          <div className="flex flex-col gap-3.5">
            <p className="mb-1 text-center text-[13px] text-[var(--text-muted)]">
              Ingresá tu PIN de 4 dígitos
            </p>
            <div className="flex justify-center gap-2.5">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="h-[60px] w-[52px] rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)] text-center text-[24px] font-bold text-[var(--text)] outline-none transition-colors focus:border-[var(--scan)]"
                />
              ))}
            </div>
            {error && <p className="text-center text-[12px] text-[var(--red)]">{error}</p>}
            <button
              onClick={handleTechLogin}
              disabled={loading || pin.some((d) => !d)}
              className="w-full rounded-lg bg-[var(--scan)] px-4 py-3 text-[14px] font-semibold text-[var(--bg)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Acceder'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
});

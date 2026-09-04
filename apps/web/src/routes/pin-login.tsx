import { useState, useRef } from 'react';
import { createRoute, useNavigate, redirect } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { useAuth } from '../lib/auth';
import { Button, Card, CardContent, Input } from '../components';

function PinLoginPage() {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.pinLogin(pin.join(''));
      navigate({ to: '/' });
    } catch {
      setError('PIN inválido');
    } finally {
      setLoading(false);
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const allFilled = pin.every((d) => d !== '');

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm p-8">
        <CardContent className="space-y-6 p-0">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Logística QR</h1>
            <p className="mt-1 text-sm text-muted-foreground">Ingresa tu PIN de 4 dígitos</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-3">
              {pin.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="password"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-14 w-14 text-center text-2xl"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              ))}
            </div>
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading || !allFilled} className="w-full" size="lg">
              {loading ? 'Verificando...' : 'Ingresar'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            ¿Eres administrador?{' '}
            <a href="/login" className="text-primary hover:underline">Ingresa con email</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export const pinLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pin-login',
  component: PinLoginPage,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
});

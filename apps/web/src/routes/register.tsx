import { useState } from 'react';
import { createRoute, useNavigate, redirect } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { useAuth } from '../lib/auth';
import { Button, Input, Card, CardContent } from '../components';

function RegisterPage() {
  const [form, setForm] = useState({
    organizationName: '',
    slug: '',
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.register(form);
      navigate({ to: '/' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm p-8">
        <CardContent className="space-y-5 p-0">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Crear cuenta</h1>
            <p className="mt-1 text-sm text-muted-foreground">Registrá tu empresa</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="text" placeholder="Nombre de la empresa"
              value={form.organizationName}
              onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
              required
            />
            <Input
              type="text" placeholder="Slug (ej: mi-empresa)"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              required
            />
            <Input
              type="text" placeholder="Tu nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              type="email" placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              type="password" placeholder="Contraseña"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{' '}
            <a href="/login" className="text-primary hover:underline">Iniciar sesión</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
});

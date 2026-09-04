import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import { protectedRoute } from './protected';
import {
  useEmployeesList,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from '../hooks/useEmployees';
import { Button, Input, Card, CardContent, Skeleton } from '../components';
import type { EmployeeResponse } from '@logistica/sdk';

function EmployeesPage() {
  const { data: employees, isLoading, isError, refetch } = useEmployeesList();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [createdPin, setCreatedPin] = useState<string | null>(null);
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setEditId(null);
    setCreatedPin(null);
    setError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleOpenEdit = (emp: EmployeeResponse) => {
    setName(emp.name);
    setEmail(emp.email ?? '');
    setPhone(emp.phone ?? '');
    setEditId(emp.id);
    setCreatedPin(null);
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editId) {
        await updateMutation.mutateAsync({
          id: editId,
          data: { name, email: email || undefined, phone: phone || undefined },
        });
      } else {
        const result = await createMutation.mutateAsync({
          name,
          email: email || undefined,
          phone: phone || undefined,
        });
        setCreatedPin(result.pin ?? null);
      }

      setName('');
      setEmail('');
      setPhone('');
      setEditId(null);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } } | undefined;
      setError(axiosErr?.response?.data?.message ?? 'Error al guardar el técnico');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este técnico?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } } | undefined;
      setError(axiosErr?.response?.data?.message ?? 'Error al eliminar el técnico');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Técnicos</h1>
        <Button onClick={handleOpenCreate}>
          {showForm ? 'Cancelar' : '+ Nuevo técnico'}
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-xl bg-card p-6">
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Email (opcional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="tel"
              placeholder="Teléfono (opcional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Guardando...'
                : editId
                  ? 'Guardar cambios'
                  : 'Crear técnico'}
            </Button>
            <Button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              variant="secondary"
            >
              Cancelar
            </Button>
          </div>
          {createdPin && (
            <div className="rounded-lg bg-green-500/10 p-4 text-sm text-green-400">
              Técnico creado. PIN asignado: <strong className="text-lg">{createdPin}</strong>
              <p className="mt-1 text-muted-foreground">Guarda este PIN, no se mostrará de nuevo.</p>
            </div>
          )}
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 p-5" />
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <p className="text-destructive">Error al cargar técnicos</p>
            <Button onClick={() => refetch()} variant="link" className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : !employees || employees.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <p className="text-muted-foreground">No hay técnicos registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => (
            <div key={emp.id} className="flex items-center justify-between rounded-xl bg-card p-5">
              <div>
                <h3 className="font-semibold text-foreground">{emp.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {emp.email ?? 'Sin email'}{emp.phone ? ` · ${emp.phone}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleOpenEdit(emp)}
                  variant="outline" size="sm"
                >
                  Editar
                </Button>
                <Button
                  onClick={() => handleDelete(emp.id)}
                  disabled={deleteMutation.isPending}
                  variant="destructive" size="sm"
                >
                  {deleteMutation.isPending ? '...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const employeesRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/employees',
  component: EmployeesPage,
});

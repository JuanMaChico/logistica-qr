import { useState } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { protectedRoute } from './protected';
import { useAuth } from '../lib/auth';
import { useEventsList, useCreateEvent, useDeleteEvent } from '../hooks/useEvents';
import { useAvailableEquipment } from '../hooks/useEquipment';
import {
  Button, Input, Textarea, Card, CardContent, Skeleton,
} from '../components';
import type { EventType, EquipmentCategory, Equipment, CreateEvent } from '@logistica/types';

const TYPE_LABELS: Record<EventType, string> = {
  party: 'Fiesta',
  business_meeting: 'Reunión',
  show: 'Espectáculo',
  other: 'Otro',
};

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  speaker: 'Parlante',
  microphone: 'Micrófono',
  screen: 'Pantalla',
  cable: 'Cable',
  other: 'Otro',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  partial_return: 'Dev. parcial',
  completed: 'Completado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-400',
  in_progress: 'text-blue-400',
  partial_return: 'text-orange-400',
  completed: 'text-green-400',
};

function EventsPage() {
  const { data: events, isLoading, isError, refetch } = useEventsList();
  const createMutation = useCreateEvent();
  const deleteMutation = useDeleteEvent();
  const { data: availableEquipment } = useAvailableEquipment();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateEvent>({
    name: '',
    type: 'party',
    clientName: '',
    departureDate: '',
    returnDate: '',
  });
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());
  const auth = useAuth();
  const navigate = useNavigate();

  const [createError, setCreateError] = useState<string | null>(null);

  const toggleEquipment = (id: string) => {
    setSelectedEquipment((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      await createMutation.mutateAsync({
        ...form,
        equipmentIds: selectedEquipment.size > 0 ? Array.from(selectedEquipment) : undefined,
      });
      setForm({ name: '', type: 'party', clientName: '', departureDate: '', returnDate: '' });
      setSelectedEquipment(new Set());
      setShowForm(false);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } } | undefined;
      const msg = axiosErr?.response?.data?.message;
      setCreateError(msg ?? 'Error al crear el evento');
    }
  };

  const groupedEquipment: Record<string, Equipment[]> = {};
  if (availableEquipment) {
    for (const eq of availableEquipment) {
      const equip = eq as Equipment;
      const key = CATEGORY_LABELS[equip.category] ?? equip.category;
      const current = groupedEquipment[key];
      if (current) {
        current.push(equip);
      } else {
        groupedEquipment[key] = [equip];
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este evento?')) return;
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Eventos</h1>
        {auth.user?.role === 'owner' && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : '+ Nuevo evento'}
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 grid grid-cols-2 gap-4 rounded-xl bg-card p-6">
          {createError && (
            <div className="col-span-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {createError}
            </div>
          )}
          <Input
            placeholder="Nombre del evento"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="col-span-2">
            <p className="mb-2 text-sm font-medium text-foreground">Tipo de evento</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(TYPE_LABELS) as [EventType, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, type: value })}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                    form.type === value
                      ? 'border-[var(--accent-dim)] bg-[var(--accent-dim)] text-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-dim)] hover:text-[var(--text)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Input
            placeholder="Nombre del cliente"
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            required
          />
          <Input
            placeholder="Teléfono (opcional)"
            value={form.clientPhone ?? ''}
            onChange={(e) => setForm({ ...form, clientPhone: e.target.value || undefined })}
          />
          <Input
            type="datetime-local"
            placeholder="Fecha salida"
            value={form.departureDate}
            onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
            required
          />
          <Input
            type="datetime-local"
            placeholder="Fecha retorno"
            value={form.returnDate}
            onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
            required
          />
          <Input
            placeholder="Dirección / Lugar (opcional)"
            value={form.clientAddress ?? ''}
            onChange={(e) => setForm({ ...form, clientAddress: e.target.value || undefined })}
          />
          <Textarea
            placeholder="Notas (opcional)"
            value={form.notes ?? ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value || undefined })}
            className="col-span-2"
            rows={3}
          />
          {availableEquipment && availableEquipment.length > 0 && (
            <div className="col-span-2">
              <p className="mb-2 text-sm font-medium text-foreground">Equipos disponibles</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {groupedEquipment && Object.entries(groupedEquipment).map(([groupLabel, items]) => (
                  <div key={groupLabel}>
                    <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {groupLabel}
                    </p>
                    <div className="space-y-1">
                      {items.map((eq) => (
                        <label
                          key={eq.id}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            selectedEquipment.has(eq.id)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-foreground hover:bg-muted'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedEquipment.has(eq.id)}
                            onChange={() => toggleEquipment(eq.id)}
                            className="h-4 w-4 accent-primary"
                          />
                          {eq.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Crear evento'}
          </Button>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <p className="text-destructive">Error al cargar eventos</p>
            <Button onClick={() => refetch()} variant="link" className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : !events || events.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <p className="text-muted-foreground">No hay eventos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {TYPE_LABELS[event.type]} — {event.clientName}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${STATUS_COLORS[event.status] ?? 'text-muted-foreground'}`}>
                    {STATUS_LABELS[event.status] ?? event.status}
                  </span>
                </div>
                <div className="mt-3 flex gap-6 text-sm text-muted-foreground">
                  <span>Salida: {new Date(event.departureDate).toLocaleDateString('es-AR')}</span>
                  <span>Retorno: {new Date(event.returnDate).toLocaleDateString('es-AR')}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => navigate({ to: `/events/${event.id}` })} variant="outline" size="sm">
                    Ver detalle
                  </Button>
                  {auth.user?.role === 'owner' && (
                    <Button
                      onClick={() => handleDelete(event.id)}
                      disabled={deleteMutation.isPending}
                      variant="destructive" size="sm"
                    >
                      {deleteMutation.isPending ? '...' : 'Eliminar'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export const eventsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/events',
  component: EventsPage,
});

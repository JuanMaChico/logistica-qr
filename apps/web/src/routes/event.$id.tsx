import { useState } from 'react';
import { createRoute, useParams, useNavigate } from '@tanstack/react-router';
import { protectedRoute } from './protected';
import { useAuth } from '../lib/auth';
import {
  useEventDetail,
  useCloseEvent,
  useRetireEquipment,
  useUndoCheckout,
  useUpdateEvent,
} from '../hooks/useEventDetail';
import {
  Button, Input, Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem, Textarea, Card, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, Skeleton,
} from '../components';
import type { EventDetail } from '@logistica/types';

const TYPE_LABELS: Record<string, string> = {
  party: 'Fiesta',
  business_meeting: 'Reunión',
  show: 'Espectáculo',
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

function EventDetailPage() {
  const { id } = useParams({ from: eventDetailRoute.id });
  const auth = useAuth();
  const navigate = useNavigate();
  const { data: event, isLoading, isError, refetch } = useEventDetail(id);
  const closeMutation = useCloseEvent();
  const retireMutation = useRetireEquipment();
  const undoCheckoutMutation = useUndoCheckout();
  const updateMutation = useUpdateEvent();

  const [retireModal, setRetireModal] = useState<{ equipmentId: string; name: string } | null>(null);
  const [retireReason, setRetireReason] = useState('');
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    type: 'party' as string,
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    departureDate: '',
    returnDate: '',
    notes: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const allItems = event?.rentals.flatMap((r) =>
    r.items.map((i) => ({ ...i, technician: r.technician }))
  ) ?? [];

  const checkedOut = allItems.filter((i) => i.scannedOutAt && !i.scannedInAt);
  const returned = allItems.filter((i) => i.scannedInAt);
  const missing = event && event.status === 'completed'
    ? []
    : allItems.filter((i) => !i.scannedInAt);

  const handleClose = async () => {
    if (!event || event.status === 'completed') return;

    if (missing.length > 0) {
      setShowPendingModal(true);
      return;
    }

    if (!confirm('¿Estás seguro de cerrar este evento?')) return;
    try {
      await closeMutation.mutateAsync(event.id);
      setMessage({ type: 'success', text: 'Evento cerrado correctamente' });
    } catch {
      setMessage({ type: 'error', text: 'Error al cerrar el evento. Verificá que todos los equipos estén devueltos.' });
    }
  };

  const handleRetire = async () => {
    if (!retireModal || !event) return;
    try {
      await retireMutation.mutateAsync({
        equipmentId: retireModal.equipmentId,
        reason: retireReason,
        eventId: event.id,
      });
      setMessage({ type: 'success', text: `${retireModal.name} dado de baja` });
      setRetireModal(null);
      setRetireReason('');
    } catch {
      setMessage({ type: 'error', text: 'Error al dar de baja el equipo' });
    }
  };

  const handleUndoCheckout = async (itemId: string, equipmentName: string) => {
    if (!event || !confirm(`¿Desasignar ${equipmentName} del evento? Se revertirá el checkout.`)) return;
    try {
      await undoCheckoutMutation.mutateAsync({ eventId: event.id, itemId });
      setMessage({ type: 'success', text: `${equipmentName} desasignado del evento` });
    } catch {
      setMessage({ type: 'error', text: 'Error al desasignar el equipo' });
    }
  };

  const openEdit = () => {
    if (!event) return;
    setEditForm({
      name: event.name,
      type: event.type,
      clientName: event.clientName,
      clientPhone: event.clientPhone ?? '',
      clientAddress: event.clientAddress ?? '',
      departureDate: new Date(event.departureDate).toISOString().slice(0, 16),
      returnDate: new Date(event.returnDate).toISOString().slice(0, 16),
      notes: event.notes ?? '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!event) return;
    try {
      await updateMutation.mutateAsync({
        id: event.id,
        data: {
          name: editForm.name,
          type: editForm.type as EventDetail['type'],
          clientName: editForm.clientName,
          clientPhone: editForm.clientPhone || undefined,
          clientAddress: editForm.clientAddress || undefined,
          departureDate: editForm.departureDate,
          returnDate: editForm.returnDate,
          notes: editForm.notes || undefined,
        },
      });
      setMessage({ type: 'success', text: 'Evento actualizado correctamente' });
      setShowEditModal(false);
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } } | undefined;
      const msg = axiosErr?.response?.data?.message;
      setMessage({ type: 'error', text: msg ?? 'Error al actualizar el evento' });
    }
  };

  if (isLoading) return (
    <div>
      <div className="mb-6">
        <Skeleton className="mb-2 h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="mb-6 grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
  if (isError) return (
    <Card className="p-8 text-center">
      <CardContent className="p-0">
        <p className="text-destructive">Error al cargar el evento</p>
        <Button onClick={() => refetch()} variant="link" className="mt-4">
          Reintentar
        </Button>
      </CardContent>
    </Card>
  );
  if (!event) return (
    <Card className="p-8 text-center">
      <CardContent className="p-0">
        <p className="text-muted-foreground">Evento no encontrado</p>
        <Button onClick={() => navigate({ to: '/events' })} variant="link" className="mt-4">
          Volver a eventos
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div>
      {message && (
        <div className={`mb-4 rounded-lg p-4 text-sm ${
          message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-destructive/10 text-destructive'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 text-muted-foreground hover:text-foreground">×</button>
        </div>
      )}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: '/events' })}
              className="text-muted-foreground transition hover:text-foreground"
            >
              ← Volver
            </button>
            <h1 className="text-2xl font-bold text-foreground">{event.name}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[event.status]}`}>
              {STATUS_LABELS[event.status]}
            </span>
          </div>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p>{TYPE_LABELS[event.type]} — Cliente: {event.clientName}</p>
            {event.clientPhone && <p>Tel: {event.clientPhone}</p>}
            {event.clientAddress && <p>Dirección: {event.clientAddress}</p>}
            <p>Salida: {new Date(event.departureDate).toLocaleString('es-AR')}</p>
            <p>Retorno: {new Date(event.returnDate).toLocaleString('es-AR')}</p>
            <p>Creado por: {event.createdBy.name}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => navigate({ to: '/scanner' })} variant="outline">
            Escáner
          </Button>
          {auth.user?.role === 'owner' && (
            <>
              <Button onClick={openEdit} variant="outline">Editar</Button>
              {event.status !== 'completed' && (
                <Button onClick={handleClose} disabled={closeMutation.isPending}>
                  {closeMutation.isPending ? 'Cerrando...' : 'Cerrar evento'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {event.notes && (
        <div className="mb-6 rounded-lg bg-card p-4 text-sm text-muted-foreground">
          <p className="text-xs text-muted-foreground">Notas:</p>
          {event.notes}
        </div>
      )}

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Equipos asignados</p>
          <p className="text-2xl font-bold text-foreground">{allItems.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">En curso</p>
          <p className={`text-2xl font-bold ${checkedOut.length > 0 ? 'text-blue-400' : 'text-muted-foreground'}`}>
            {checkedOut.length}
          </p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Devueltos</p>
          <p className="text-2xl font-bold text-green-400">{returned.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Pendientes</p>
          <p className={`text-2xl font-bold ${missing.length > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
            {missing.length}
          </p>
        </CardContent></Card>
      </div>

      {event.rentals.map((rental) => (
        <Card key={rental.id} className="mb-4">
          <div className="border-b px-5 py-3">
            <p className="text-sm text-muted-foreground">
              Técnico: <span className="text-foreground">{rental.technician.name}</span>
            </p>
          </div>
          <div className="divide-y">
            {rental.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{item.equipment.name}</span>
                    <span className="text-xs text-muted-foreground">{item.equipment.qrCode} — {item.equipment.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {!item.scannedInAt ? (
                    <span className="text-sm text-yellow-400">Pendiente</span>
                  ) : (
                    <div className="text-right text-sm">
                      <span className="text-green-400">Devuelto</span>
                      {item.returnCondition === 'damaged' && (
                        <span className="ml-2 text-destructive">(Dañado)</span>
                      )}
                    </div>
                  )}
                  {auth.user?.role === 'owner' && !item.scannedInAt && (
                    <>
                      <Button
                        onClick={() => handleUndoCheckout(item.id, item.equipment.name)}
                        disabled={undoCheckoutMutation.isPending}
                        variant="outline" size="sm"
                      >
                        Desasignar
                      </Button>
                      <Button
                        onClick={() => setRetireModal({
                          equipmentId: item.equipment.id,
                          name: item.equipment.name,
                        })}
                        variant="destructive" size="sm"
                      >
                        Dar de baja
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Equipos pendientes de devolución</DialogTitle>
            <DialogDescription>
              {missing.length} equipo(s) aún no fueron devueltos. Podés darlos de baja o esperar a que los devuelvan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {missing.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.equipment.name}</p>
                  <p className="text-xs text-muted-foreground">{item.equipment.qrCode}</p>
                </div>
                <Button
                  onClick={() => {
                    setShowPendingModal(false);
                    setRetireModal({ equipmentId: item.equipment.id, name: item.equipment.name });
                  }}
                  variant="destructive" size="sm"
                >
                  Dar de baja
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPendingModal(false)} variant="outline">Volver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nombre del evento"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Select value={editForm.type} onValueChange={(v) => setEditForm((f) => ({ ...f, type: v ?? '' }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Cliente"
              value={editForm.clientName}
              onChange={(e) => setEditForm((f) => ({ ...f, clientName: e.target.value }))}
            />
            <Input
              placeholder="Teléfono del cliente"
              value={editForm.clientPhone}
              onChange={(e) => setEditForm((f) => ({ ...f, clientPhone: e.target.value }))}
            />
            <Input
              placeholder="Dirección del evento"
              value={editForm.clientAddress}
              onChange={(e) => setEditForm((f) => ({ ...f, clientAddress: e.target.value }))}
            />
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="mb-1 text-xs text-muted-foreground">Salida</p>
                <Input
                  type="datetime-local"
                  value={editForm.departureDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, departureDate: e.target.value }))}
                />
              </div>
              <div className="flex-1">
                <p className="mb-1 text-xs text-muted-foreground">Retorno</p>
                <Input
                  type="datetime-local"
                  value={editForm.returnDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, returnDate: e.target.value }))}
                />
              </div>
            </div>
            <Textarea
              placeholder="Notas"
              value={editForm.notes}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending || !editForm.name.trim() || !editForm.clientName.trim()}
            >
              {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button onClick={() => setShowEditModal(false)} variant="outline">Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!retireModal} onOpenChange={(open) => { if (!open) { setRetireModal(null); setRetireReason(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dar de baja equipo</DialogTitle>
            <DialogDescription>
              {retireModal?.name} — Se marcará como perdido/roto irreversible y quedará fuera del inventario.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo de la baja (obligatorio)"
            value={retireReason}
            onChange={(e) => setRetireReason(e.target.value)}
            rows={3}
            required
          />
          <DialogFooter>
            <Button
              onClick={handleRetire}
              disabled={retireMutation.isPending || !retireReason.trim()}
              variant="destructive"
            >
              {retireMutation.isPending ? 'Dando de baja...' : 'Confirmar baja'}
            </Button>
            <Button onClick={() => { setRetireModal(null); setRetireReason(''); }} variant="outline">Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {allItems.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <p className="text-muted-foreground">No hay equipos asignados a este evento.</p>
            <p className="mt-1 text-sm text-muted-foreground">Usá el escáner para registrar la salida de equipos.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export const eventDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/events/$id',
  component: EventDetailPage,
});

import { createRoute, useParams, useNavigate } from '@tanstack/react-router';
import { protectedRoute } from './protected';
import { useEquipmentHistory } from '../hooks/useEquipmentHistory';
import { Skeleton, Card, CardContent, Button } from '../components';

function EquipmentHistoryPage() {
  const { id } = useParams({ from: equipmentHistoryRoute.id });
  const navigate = useNavigate();
  const { equipment, logs, isLoading, isError, refetch } = useEquipmentHistory(id);

  if (isLoading) return (
    <div>
      <div className="mb-6">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
  if (isError) return (
    <Card className="p-8 text-center">
      <CardContent className="p-0">
        <p className="text-destructive">Error al cargar el historial</p>
        <Button onClick={() => refetch()} variant="link" className="mt-4">
          Reintentar
        </Button>
      </CardContent>
    </Card>
  );
  if (!equipment) return (
    <Card className="p-8 text-center">
      <CardContent className="p-0">
        <p className="text-muted-foreground">Equipo no encontrado</p>
        <Button onClick={() => navigate({ to: '/equipment' })} variant="link" className="mt-4">
          Volver a equipos
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: '/equipment' })}
            className="text-muted-foreground transition hover:text-foreground"
          >
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-foreground">{equipment.name}</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{equipment.qrCode}</p>
      </div>

      {logs.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <p className="text-muted-foreground">No hay movimientos registrados para este equipo.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{log.reason}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Evento: {log.event?.name ?? log.eventId}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{new Date(log.createdAt).toLocaleDateString('es-AR')}</p>
                    <p>{new Date(log.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                {log.registrar && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Registrado por: {log.registrar.name}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export const equipmentHistoryRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/equipment/$id',
  component: EquipmentHistoryPage,
});

import { createRoute, useNavigate } from '@tanstack/react-router';
import { protectedRoute } from './protected';
import { useAllEquipmentLogs } from '../hooks/useEquipmentHistory';
import { useEquipmentList } from '../hooks/useEquipment';
import { useAuth } from '../lib/auth';
import { downloadCsv } from '../lib/export';
import {
  Button, Card, CardContent, Skeleton,
} from '../components';

const CATEGORY_LABELS: Record<string, string> = {
  speaker: 'Parlante',
  microphone: 'Micrófono',
  screen: 'Pantalla',
  cable: 'Cable',
  other: 'Otro',
};

function BajasPage() {
  const { data: logs, isLoading: logsLoading, isError: logsError, refetch: refetchLogs } = useAllEquipmentLogs();
  const { data: equipment, isLoading: equipLoading } = useEquipmentList();
  const auth = useAuth();
  const navigate = useNavigate();
  const isLoading = logsLoading || equipLoading;

  const retiredEquipment = equipment?.filter((eq) => eq.availabilityStatus === 'retired') ?? [];

  const handleExportLogs = () => {
    if (!logs) return;
    downloadCsv(
      'historial-bajas.csv',
      ['Equipo', 'Código QR', 'Motivo', 'Evento', 'Registrado por', 'Fecha'],
      logs.map((log) => [
        log.equipment?.name ?? log.equipmentId,
        log.equipment?.qrCode ?? '',
        log.reason,
        log.event?.name ?? log.eventId,
        log.registrar?.name ?? log.registeredById,
        new Date(log.createdAt).toLocaleDateString('es-AR'),
      ]),
    );
  };

  const handleExportEquipment = () => {
    if (!retiredEquipment) return;
    downloadCsv(
      'equipos-dados-de-baja.csv',
      ['Nombre', 'Código QR', 'Categoría', 'Estado físico'],
      retiredEquipment.map((eq) => [
        eq.name,
        eq.qrCode,
        CATEGORY_LABELS[eq.category] ?? eq.category,
        eq.physicalStatus === 'damaged' ? 'Dañado' : eq.physicalStatus === 'in_repair' ? 'En reparación' : 'Bueno',
      ]),
    );
  };

  if (isLoading) {
    return (
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
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bajas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Equipos dados de baja y registro histórico
          </p>
        </div>
        {auth.user?.role === 'owner' && (
          <div className="flex gap-2">
            <Button onClick={handleExportEquipment} variant="outline" size="sm">
              Exportar equipos
            </Button>
            <Button onClick={handleExportLogs} variant="outline" size="sm">
              Exportar historial
            </Button>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Equipos dados de baja ({retiredEquipment.length})
        </h2>
        {retiredEquipment.length === 0 ? (
          <Card className="p-8 text-center">
            <CardContent className="p-0">
              <p className="text-muted-foreground">No hay equipos dados de baja</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {retiredEquipment.map((eq) => (
              <Card key={eq.id}>
                <CardContent className="p-5">
                  <div className="mb-2">
                    <h3 className="font-semibold text-foreground">{eq.name}</h3>
                    <p className="text-sm text-muted-foreground">{eq.qrCode}</p>
                  </div>
                  <div className="mb-3 flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{CATEGORY_LABELS[eq.category] ?? eq.category}</span>
                    <span className="text-red-400">Dado de baja</span>
                  </div>
                  {auth.user?.role === 'owner' && (
                    <Button
                      onClick={() => navigate({ to: `/equipment/${eq.id}` })}
                      variant="outline" size="sm"
                    >
                      Ver historial
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          Historial de bajas ({logs?.length ?? 0})
        </h2>
        {logsError ? (
          <Card className="p-8 text-center">
            <CardContent className="p-0">
              <p className="text-destructive">Error al cargar el historial</p>
              <Button onClick={() => refetchLogs()} variant="link" className="mt-4">
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : !logs || logs.length === 0 ? (
          <Card className="p-8 text-center">
            <CardContent className="p-0">
              <p className="text-muted-foreground">No hay movimientos registrados</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {log.equipment?.name ?? 'Equipo'} — {log.reason}
                      </p>
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
    </div>
  );
}

export const bajasRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/bajas',
  component: BajasPage,
});

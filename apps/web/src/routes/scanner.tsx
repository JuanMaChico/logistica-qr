import { useState, useEffect, useRef, useCallback } from 'react';
import { createRoute } from '@tanstack/react-router';
import { Html5Qrcode } from 'html5-qrcode';
import { protectedRoute } from './protected';
import { useScannerEvents, useCheckout, useCheckin } from '../hooks/useScanner';
import {
  Button, Card, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, Skeleton,
} from '../components';

type ScanMode = 'checkout' | 'checkin';

function ScannerPage() {
  const { data: events, isLoading, isError, refetch } = useScannerEvents();
  const checkoutMutation = useCheckout();
  const checkinMutation = useCheckin();
  const [selectedEvent, setSelectedEvent] = useState<{ id: string; name: string; clientName: string } | null>(null);
  const [mode, setMode] = useState<ScanMode>('checkout');
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<'ok' | 'error' | null>(null);
  const [showConditionDialog, setShowConditionDialog] = useState(false);
  const [pendingEquipmentId, setPendingEquipmentId] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, []);

  const startScanner = useCallback(async () => {
    if (scannerRef.current) return;
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {},
      );
      setScanning(true);
    } catch {
      setScanning(false);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    try {
      await scannerRef.current?.stop();
      scannerRef.current = null;
    } catch {
      // scanner already stopped/disposed — nothing to clean up
    }
    setScanning(false);
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    await stopScanner();
    const qrCode = decodedText.trim();

    if (mode === 'checkin') {
      setPendingEquipmentId(qrCode);
      setShowConditionDialog(true);
    } else {
      await handleCheckout(qrCode);
    }
  };

  const handleCheckout = async (qrCode: string) => {
    if (!selectedEvent) return;
    try {
      await checkoutMutation.mutateAsync({ eventId: selectedEvent.id, qrCode });
      setLastResult('ok');
      setLastScan(qrCode);
    } catch {
      setLastResult('error');
      setLastScan(qrCode);
    }
  };

  const handleCheckinWithCondition = async (condition?: 'good' | 'damaged') => {
    setShowConditionDialog(false);
    if (!selectedEvent || !pendingEquipmentId) return;
    try {
      await checkinMutation.mutateAsync({
        eventId: selectedEvent.id,
        qrCode: pendingEquipmentId,
        condition,
      });
      setLastResult('ok');
      setLastScan(pendingEquipmentId);
    } catch {
      setLastResult('error');
      setLastScan(pendingEquipmentId);
    }
    setPendingEquipmentId(null);
  };

  if (!selectedEvent) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-foreground">Escáner QR</h1>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 p-4" />
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
              <p className="text-muted-foreground">No hay eventos disponibles</p>
              <p className="mt-1 text-sm text-muted-foreground">Creá un evento desde la sección Eventos</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Seleccioná un evento para escanear</p>
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="w-full rounded-xl bg-card p-4 text-left transition hover:bg-card-hover"
              >
                <h3 className="font-semibold text-foreground">{event.name}</h3>
                <p className="text-sm text-muted-foreground">{event.clientName}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{selectedEvent.name}</h1>
          <p className="text-sm text-muted-foreground">{selectedEvent.clientName}</p>
        </div>
        <Button
          onClick={() => { stopScanner(); setSelectedEvent(null); }}
          variant="secondary"
        >
          Cambiar evento
        </Button>
      </div>

      <div className="mb-6 flex gap-2">
        <Button
          onClick={() => setMode('checkout')}
          variant={mode === 'checkout' ? 'default' : 'outline'}
        >
          Check-out (salida)
        </Button>
        <Button
          onClick={() => setMode('checkin')}
          variant={mode === 'checkin' ? 'default' : 'outline'}
        >
          Check-in (retorno)
        </Button>
      </div>

      {lastScan && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${
          lastResult === 'ok' ? 'bg-green-500/10 text-green-400' : 'bg-destructive/10 text-destructive'
        }`}>
          {lastResult === 'ok'
            ? `Salida registrada: ${lastScan}`
            : `Error: ${lastScan}`}
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        <div id="qr-reader" className="w-full max-w-sm overflow-hidden rounded-xl" />

        {!scanning ? (
          <Button onClick={startScanner} size="lg">
            Iniciar escáner
          </Button>
        ) : (
          <Button onClick={stopScanner} variant="destructive" size="lg">
            Detener escáner
          </Button>
        )}

        <p className="text-sm text-muted-foreground">
          Escaneá el código QR del equipo para registrar su{' '}
          {mode === 'checkout' ? 'salida' : 'retorno'}
        </p>
      </div>

      <Dialog open={showConditionDialog} onOpenChange={setShowConditionDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Estado del equipo</DialogTitle>
            <DialogDescription>
              ¿El equipo {pendingEquipmentId} está en buen estado?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3 sm:justify-center">
            <Button
              onClick={() => handleCheckinWithCondition('good')}
              className="flex-1"
            >
              Buen estado
            </Button>
            <Button
              onClick={() => handleCheckinWithCondition('damaged')}
              variant="destructive"
              className="flex-1"
            >
              Dañado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const scannerRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/scanner',
  component: ScannerPage,
});

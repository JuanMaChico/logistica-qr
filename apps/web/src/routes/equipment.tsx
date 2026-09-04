import { useState, useRef } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { protectedRoute } from './protected';
import { useAuth } from '../lib/auth';
import {
  useEquipmentList,
  useCreateEquipment,
  useUpdateEquipment,
  useDeleteEquipment,
  useRestoreEquipment,
} from '../hooks/useEquipment';
import {
  Button, Input, Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem, Card, CardContent,
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
  Skeleton,
} from '../components';
import { downloadCsv } from '../lib/export';
import type { Equipment, EquipmentCategory } from '@logistica/types';
import QRCode from 'qrcode';

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  speaker: 'Parlante',
  microphone: 'Micrófono',
  screen: 'Pantalla',
  cable: 'Cable',
  other: 'Otro',
};

const STATUS_COLORS: Record<string, string> = {
  available: 'text-green-400',
  rented: 'text-yellow-400',
  retired: 'text-red-400',
};

function EquipmentPage() {
  const { data: equipment, isLoading, isError, refetch } = useEquipmentList();
  const createMutation = useCreateEquipment();
  const updateMutation = useUpdateEquipment();
  const deleteMutation = useDeleteEquipment();
  const restoreMutation = useRestoreEquipment();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('speaker');
  const [qrModal, setQrModal] = useState<Equipment | null>(null);
  const [editModal, setEditModal] = useState<Equipment | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<EquipmentCategory>('speaker');
  const qrImageRef = useRef<HTMLImageElement>(null);
  const auth = useAuth();
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await createMutation.mutateAsync({ name, category });
    setName('');
    setCategory('speaker');
    setShowForm(false);
    if (created.qrImage) {
      setQrModal(created);
    }
  };

  const handleEdit = (eq: Equipment) => {
    setEditName(eq.name);
    setEditCategory(eq.category);
    setEditModal(eq);
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    await updateMutation.mutateAsync({ id: editModal.id, data: { name: editName, category: editCategory } });
    setEditModal(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este equipo?')) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleRestore = async (id: string) => {
    if (!confirm('¿Restaurar este equipo? Volverá a estar disponible.')) return;
    await restoreMutation.mutateAsync(id);
  };

  const handleExportCsv = () => {
    if (!equipment) return;
    downloadCsv(
      'equipos.csv',
      ['Nombre', 'Código QR', 'Categoría', 'Disponibilidad', 'Estado físico'],
      equipment.map((eq) => [
        eq.name,
        eq.qrCode,
        CATEGORY_LABELS[eq.category] ?? eq.category,
        eq.availabilityStatus === 'available' ? 'Disponible'
          : eq.availabilityStatus === 'rented' ? 'En alquiler' : 'Dado de baja',
        eq.physicalStatus === 'damaged' ? 'Dañado' : eq.physicalStatus === 'in_repair' ? 'En reparación' : 'Bueno',
      ]),
    );
  };

  const handleShowQr = async (eq: Equipment) => {
    if (eq.qrImage) {
      setQrModal(eq as Equipment & { qrImage?: string });
      return;
    }
    const qrImage = await QRCode.toDataURL(eq.qrCode, { width: 300, margin: 2 });
    setQrModal({ ...eq, qrImage });
  };

  const handleDownload = () => {
    const img = qrImageRef.current;
    if (!img) return;
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `${qrModal?.qrCode ?? 'qr'}.png`;
    a.click();
  };

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.write(`
      <html>
        <head>
          <style>
            body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .qr-container { text-align: center; }
            img { width: 400px; height: 400px; image-rendering: pixelated; }
            .code { font-family: monospace; font-size: 24px; margin-top: 16px; }
            .name { font-family: sans-serif; font-size: 18px; margin-top: 8px; color: #666; }
            @media print { body { -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${qrModal?.qrImage ?? ''}" />
            <div class="code">${qrModal?.qrCode ?? ''}</div>
            <div class="name">${qrModal?.name ?? ''}</div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Equipos</h1>
        {auth.user?.role === 'owner' && (
          <div className="flex gap-2">
            <Button onClick={handleExportCsv} variant="outline" size="sm">
              Exportar CSV
            </Button>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancelar' : '+ Nuevo equipo'}
            </Button>
          </div>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 flex gap-4 rounded-xl bg-card p-6">
          <Input
            placeholder="Nombre del equipo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Select value={category} onValueChange={(v) => setCategory(v as EquipmentCategory)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Crear'}
          </Button>
        </form>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <p className="text-destructive">Error al cargar equipos</p>
            <Button onClick={() => refetch()} variant="link" className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : !equipment || equipment.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <p className="text-muted-foreground">No hay equipos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map((eq) => (
            <Card key={eq.id}>
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{eq.name}</h3>
                    <p className="text-sm text-muted-foreground">{eq.qrCode}</p>
                  </div>
                  <span className={`text-sm font-medium ${STATUS_COLORS[eq.availabilityStatus] ?? 'text-muted-foreground'}`}>
                    {eq.availabilityStatus === 'available' ? 'Disponible'
                      : eq.availabilityStatus === 'rented' ? 'En alquiler'
                      : 'Dado de baja'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{CATEGORY_LABELS[eq.category]}</span>
                  {eq.physicalStatus === 'damaged' && (
                    <span className="text-destructive">Dañado</span>
                  )}
                </div>
                {auth.user?.role === 'owner' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={() => handleShowQr(eq)} variant="outline" size="sm">
                      Ver QR
                    </Button>
                    <Button onClick={() => handleEdit(eq)} variant="outline" size="sm">
                      Editar
                    </Button>
                    <Button onClick={() => navigate({ to: `/equipment/${eq.id}` })} variant="outline" size="sm">
                      Historial
                    </Button>
                    {eq.availabilityStatus === 'retired' ? (
                      <Button
                        onClick={() => handleRestore(eq.id)}
                        disabled={restoreMutation.isPending}
                        variant="outline" size="sm"
                      >
                        {restoreMutation.isPending ? '...' : 'Restaurar'}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleDelete(eq.id)}
                        disabled={deleteMutation.isPending}
                        variant="destructive" size="sm"
                      >
                        {deleteMutation.isPending ? '...' : 'Eliminar'}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editModal} onOpenChange={(open) => { if (!open) setEditModal(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar equipo</DialogTitle>
            <DialogDescription>{editModal?.qrCode}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Nombre del equipo"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
            <Select value={editCategory} onValueChange={(v) => setEditCategory(v as EquipmentCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending || !editName.trim()}>
              {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button onClick={() => setEditModal(null)} variant="outline">Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!qrModal} onOpenChange={(open) => { if (!open) setQrModal(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{qrModal?.name}</DialogTitle>
            <DialogDescription>{qrModal?.qrCode}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <img
              ref={qrImageRef}
              src={qrModal?.qrImage ?? ''}
              alt={`QR ${qrModal?.qrCode ?? ''}`}
              className="h-64 w-64 rounded-lg"
            />
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-center">
            <Button onClick={handlePrint}>Imprimir</Button>
            <Button onClick={handleDownload} variant="outline">Descargar PNG</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const equipmentRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/equipment',
  component: EquipmentPage,
});

import { useState } from 'react';
import { createRoute } from '@tanstack/react-router';
import { protectedRoute } from './protected';
import { useAuth } from '../lib/auth';
import { useDashboardStats, useEquipmentByCategory, useEventsByMonth, useTopEquipment } from '../hooks/useDashboard';
import { Skeleton, Card, CardContent, Button } from '../components';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  speaker: '#3b82f6',
  microphone: '#10b981',
  cable: '#f59e0b',
  screen: '#8b5cf6',
  other: '#6b7280',
};

const CATEGORY_LABELS: Record<string, string> = {
  speaker: 'Parlantes',
  microphone: 'Micrófonos',
  cable: 'Cables',
  screen: 'Pantallas',
  other: 'Otros',
};

function DashboardPage() {
  const auth = useAuth();
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();
  const { data: byCategory } = useEquipmentByCategory();
  const { data: byMonth } = useEventsByMonth(6);
  const { data: topEquipment } = useTopEquipment(5);
  const [months, setMonths] = useState(6);

  const cards = stats ? [
    { label: 'Total equipos', value: stats.totalEquipment, color: 'text-blue-400' },
    { label: 'Disponibles', value: stats.available, color: 'text-green-400' },
    { label: 'En alquiler', value: stats.rented, color: 'text-yellow-400' },
    { label: 'Dañados', value: stats.damaged, color: 'text-red-400' },
    { label: 'En reparación', value: stats.inRepair, color: 'text-orange-400' },
    { label: 'Dados de baja', value: stats.retired, color: 'text-gray-500' },
    { label: 'Eventos activos', value: stats.activeEvents, color: 'text-purple-400' },
    { label: 'Rentas activas', value: stats.activeRentals, color: 'text-cyan-400' },
  ] : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Bienvenido{auth.user?.role === 'owner' ? '' : ' técnico'}, {auth.user?.name}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <p className="text-destructive">Error al cargar estadísticas</p>
            <Button onClick={() => refetch()} variant="link" className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : !stats ? (
        <Card className="p-8 text-center">
          <CardContent className="p-0">
            <p className="text-muted-foreground">No hay estadísticas disponibles</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.label}>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className={`mt-2 text-3xl font-bold ${card.color}`}>{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Equipos por categoría</h2>
            {!byCategory || byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byCategory} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={80}>
                    {byCategory.map((entry) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] ?? '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, CATEGORY_LABELS[name as string] ?? name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-4 space-y-1">
              {byCategory?.map((entry) => (
                <div key={entry.category} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[entry.category] ?? '#6b7280' }} />
                    {CATEGORY_LABELS[entry.category] ?? entry.category}
                  </span>
                  <span className="font-medium text-foreground">{entry.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Eventos por mes</h2>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="rounded-lg border bg-card px-2 py-1 text-sm text-foreground"
              >
                <option value={3}>3 meses</option>
                <option value={6}>6 meses</option>
                <option value={12}>12 meses</option>
              </select>
            </div>
            {!byMonth || byMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Equipos más usados</h2>
            {!topEquipment || topEquipment.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topEquipment} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(value) => [value, 'Usos']} />
                  <Bar dataKey="timesUsed" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/',
  component: DashboardPage,
});

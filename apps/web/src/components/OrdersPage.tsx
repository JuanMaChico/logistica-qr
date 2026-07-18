import { useOrdersQuery } from '../hooks/useOrdersQuery';
import { OrdersTable } from './OrdersTable';
import type { Order } from '@tokin/api-client';

const SAMPLE_ORDERS: Order[] = [
  { id: 'ORD-001', customerName: 'Ana García', email: 'ana@example.com', total: 1250.00, status: 'delivered', createdAt: '2026-06-15T10:00:00Z', items: 3 },
  { id: 'ORD-002', customerName: 'Carlos López', email: 'carlos@example.com', total: 89.99, status: 'processing', createdAt: '2026-06-16T14:30:00Z', items: 1 },
  { id: 'ORD-003', customerName: 'María Rodríguez', email: 'maria@example.com', total: 450.50, status: 'shipped', createdAt: '2026-06-17T09:15:00Z', items: 5 },
  { id: 'ORD-004', customerName: 'Pedro Martínez', email: 'pedro@example.com', total: 2300.00, status: 'pending', createdAt: '2026-06-18T11:00:00Z', items: 8 },
  { id: 'ORD-005', customerName: 'Laura Sánchez', email: 'laura@example.com', total: 75.25, status: 'cancelled', createdAt: '2026-06-18T16:45:00Z', items: 2 },
  { id: 'ORD-006', customerName: 'Diego Hernández', email: 'diego@example.com', total: 890.00, status: 'delivered', createdAt: '2026-06-19T08:30:00Z', items: 4 },
  { id: 'ORD-007', customerName: 'Sofía Torres', email: 'sofia@example.com', total: 1500.00, status: 'processing', createdAt: '2026-06-19T13:00:00Z', items: 6 },
  { id: 'ORD-008', customerName: 'Javier Ruiz', email: 'javier@example.com', total: 320.00, status: 'pending', createdAt: '2026-06-20T10:30:00Z', items: 3 },
  { id: 'ORD-009', customerName: 'Valentina Morales', email: 'valentina@example.com', total: 2100.00, status: 'shipped', createdAt: '2026-06-20T15:00:00Z', items: 7 },
  { id: 'ORD-010', customerName: 'Andrés Vega', email: 'andres@example.com', total: 95.00, status: 'delivered', createdAt: '2026-06-21T09:00:00Z', items: 1 },
  { id: 'ORD-011', customerName: 'Camila Rojas', email: 'camila@example.com', total: 670.00, status: 'processing', createdAt: '2026-06-21T12:00:00Z', items: 4 },
  { id: 'ORD-012', customerName: 'Fernando Castillo', email: 'fernando@example.com', total: 1800.00, status: 'pending', createdAt: '2026-06-22T10:00:00Z', items: 9 },
];

function OrdersPage() {
  const { data, isLoading, error } = useOrdersQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 font-medium">Error loading orders</p>
        <p className="text-gray-500 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  const orders = data?.data ?? SAMPLE_ORDERS;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
        <p className="text-gray-500 mt-1">Manage and track all customer orders.</p>
      </div>
      <OrdersTable data={orders} />
    </div>
  );
}

export default OrdersPage;

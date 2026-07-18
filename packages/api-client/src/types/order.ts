export interface Order {
  id: string;
  customerName: string;
  email: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface NewOrder {
  customerName: string;
  email: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export interface UpdateOrderPayload {
  status?: OrderStatus;
  customerName?: string;
  email?: string;
}

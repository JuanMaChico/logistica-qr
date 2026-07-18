import type { Order, NewOrder, UpdateOrderPayload, PaginatedResponse } from '../types';
import { apiClient } from '../client';

export function getOrders(): Promise<PaginatedResponse<Order>> {
  return apiClient.get('/orders').then((res) => res.data);
}

export function getOrderById(id: string): Promise<Order> {
  return apiClient.get(`/orders/${id}`).then((res) => res.data);
}

export function createOrder(payload: NewOrder): Promise<Order> {
  return apiClient.post('/orders', payload).then((res) => res.data);
}

export function updateOrder(id: string, payload: UpdateOrderPayload): Promise<Order> {
  return apiClient.patch(`/orders/${id}`, payload).then((res) => res.data);
}

export function deleteOrder(id: string): Promise<void> {
  return apiClient.delete(`/orders/${id}`);
}

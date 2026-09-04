import { apiClient } from '../client';
import type { ReturnCondition } from '@logistica/types';

export async function checkout(eventId: string, equipmentId: string, notes?: string) {
  const { data } = await apiClient.post(`/events/${eventId}/checkout`, { equipmentId, notes });
  return data;
}

export async function checkin(eventId: string, equipmentId: string, condition?: ReturnCondition, notes?: string) {
  const { data } = await apiClient.post(`/events/${eventId}/checkin`, { equipmentId, condition, notes });
  return data;
}

export async function undoCheckout(eventId: string, itemId: string) {
  const { data } = await apiClient.post(`/events/${eventId}/rental-items/${itemId}/undo-checkout`);
  return data;
}

export async function closeEvent(eventId: string) {
  const { data } = await apiClient.post(`/events/${eventId}/close`);
  return data;
}

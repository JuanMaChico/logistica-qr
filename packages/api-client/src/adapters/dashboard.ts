import { apiClient } from '../client';
import type { DashboardStats, EquipmentByCategory, EventsByMonth, TopEquipment } from '@logistica/types';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/dashboard/stats');
  return data;
}

export async function fetchEquipmentByCategory(): Promise<EquipmentByCategory[]> {
  const { data } = await apiClient.get<EquipmentByCategory[]>('/dashboard/equipment-by-category');
  return data;
}

export async function fetchEventsByMonth(months: number = 6): Promise<EventsByMonth[]> {
  const { data } = await apiClient.get<EventsByMonth[]>('/dashboard/events-by-month', { params: { months } });
  return data;
}

export async function fetchTopEquipment(limit: number = 5): Promise<TopEquipment[]> {
  const { data } = await apiClient.get<TopEquipment[]>('/dashboard/top-equipment', { params: { limit } });
  return data;
}

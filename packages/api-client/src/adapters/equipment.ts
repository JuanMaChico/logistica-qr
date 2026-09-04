import { apiClient } from '../client';
import type { Equipment, CreateEquipment, EquipmentLog } from '@logistica/types';

export async function fetchEquipment(): Promise<Equipment[]> {
  const { data } = await apiClient.get<Equipment[]>('/equipment');
  return data;
}

export async function fetchEquipmentById(id: string): Promise<Equipment> {
  const { data } = await apiClient.get<Equipment>(`/equipment/${id}`);
  return data;
}

export async function createEquipment(dto: CreateEquipment): Promise<Equipment> {
  const { data } = await apiClient.post<Equipment>('/equipment', dto);
  return data;
}

export async function updateEquipment(id: string, dto: Partial<CreateEquipment>): Promise<Equipment> {
  const { data } = await apiClient.put<Equipment>(`/equipment/${id}`, dto);
  return data;
}

export async function deleteEquipment(id: string): Promise<void> {
  await apiClient.delete(`/equipment/${id}`);
}

export async function retireEquipment(id: string, reason: string, eventId: string): Promise<Equipment> {
  const { data } = await apiClient.post<Equipment>(`/equipment/${id}/retire`, { reason, eventId });
  return data;
}

export async function fetchEquipmentLogs(id: string): Promise<EquipmentLog[]> {
  const { data } = await apiClient.get<EquipmentLog[]>(`/equipment/${id}/logs`);
  return data;
}

export async function fetchAllEquipmentLogs(): Promise<EquipmentLog[]> {
  const { data } = await apiClient.get<EquipmentLog[]>('/equipment/logs');
  return data;
}

export async function restoreEquipment(id: string): Promise<Equipment> {
  const { data } = await apiClient.post<Equipment>(`/equipment/${id}/restore`);
  return data;
}

export async function fetchAvailableEquipment(): Promise<Equipment[]> {
  const { data } = await apiClient.get<Equipment[]>('/equipment/available');
  return data;
}

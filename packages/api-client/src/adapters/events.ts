import { apiClient } from '../client';
import type { Event, CreateEvent, EventDetail, EventCounts } from '@logistica/types';

export async function fetchEvents(): Promise<Event[]> {
  const { data } = await apiClient.get<Event[]>('/events');
  return data;
}

export async function fetchEventById(id: string): Promise<EventDetail> {
  const { data } = await apiClient.get<EventDetail>(`/events/${id}`);
  return data;
}

export async function createEvent(dto: CreateEvent): Promise<Event> {
  const { data } = await apiClient.post<Event>('/events', dto);
  return data;
}

export async function updateEvent(id: string, dto: Partial<CreateEvent>): Promise<Event> {
  const { data } = await apiClient.put<Event>(`/events/${id}`, dto);
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/events/${id}`);
}

export async function fetchEventCount(status?: string): Promise<EventCounts> {
  const params = status ? { status } : {};
  const { data } = await apiClient.get<EventCounts>('/events/count', { params });
  return data;
}

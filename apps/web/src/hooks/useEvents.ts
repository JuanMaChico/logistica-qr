import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEvents, fetchEventCount, createEvent, deleteEvent } from '@logistica/sdk';
import { queryKeys } from '../lib/queryKeys';
import type { CreateEvent } from '@logistica/types';

export function useEventsList() {
  return useQuery({
    queryKey: queryKeys.events.all,
    queryFn: fetchEvents,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEvent) => createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

export function useEventCount(status?: string) {
  return useQuery({
    queryKey: queryKeys.events.count(status),
    queryFn: () => fetchEventCount(status),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

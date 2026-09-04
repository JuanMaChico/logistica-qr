import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchEventById,
  closeEvent,
  retireEquipment,
  undoCheckout,
  updateEvent,
} from '@logistica/sdk';
import { queryKeys } from '../lib/queryKeys';

export function useEventDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.eventDetail(id),
    queryFn: () => fetchEventById(id),
  });
}

export function useCloseEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => closeEvent(eventId),
    onSuccess: (_data, eventId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDetail(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

export function useRetireEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { equipmentId: string; reason: string; eventId: string }) =>
      retireEquipment(vars.equipmentId, vars.reason, vars.eventId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDetail(vars.eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    },
  });
}

export function useUndoCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { eventId: string; itemId: string }) =>
      undoCheckout(vars.eventId, vars.itemId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDetail(vars.eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: Record<string, unknown> }) =>
      updateEvent(vars.id, vars.data),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDetail(vars.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
}

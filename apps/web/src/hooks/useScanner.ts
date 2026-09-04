import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchEvents, checkout, checkin } from '@logistica/sdk';
import { queryKeys } from '../lib/queryKeys';

export function useScannerEvents() {
  return useQuery({
    queryKey: queryKeys.events.all,
    queryFn: fetchEvents,
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { eventId: string; qrCode: string }) =>
      checkout(vars.eventId, vars.qrCode),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDetail(vars.eventId) });
    },
  });
}

export function useCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { eventId: string; qrCode: string; condition?: 'good' | 'damaged' }) =>
      checkin(vars.eventId, vars.qrCode, vars.condition),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventDetail(vars.eventId) });
    },
  });
}

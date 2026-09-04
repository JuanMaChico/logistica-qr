import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  restoreEquipment,
  fetchAvailableEquipment,
} from '@logistica/sdk';
import { queryKeys } from '../lib/queryKeys';
import type { EquipmentCategory } from '@logistica/types';

export function useEquipmentList() {
  return useQuery({
    queryKey: queryKeys.equipment.all,
    queryFn: fetchEquipment,
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { name: string; category: EquipmentCategory }) =>
      createEquipment(vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: { name?: string; category?: EquipmentCategory } }) =>
      updateEquipment(vars.id, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    },
  });
}

export function useAvailableEquipment() {
  return useQuery({
    queryKey: queryKeys.equipment.available,
    queryFn: fetchAvailableEquipment,
  });
}

export function useRestoreEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.allEquipmentLogs });
    },
  });
}

import { useQuery, useQueries } from '@tanstack/react-query';
import { fetchEquipmentById, fetchEquipmentLogs, fetchAllEquipmentLogs } from '@logistica/sdk';
import { queryKeys } from '../lib/queryKeys';

export function useEquipmentHistory(id: string) {
  const results = useQueries({
    queries: [
      {
        queryKey: queryKeys.equipmentDetail(id),
        queryFn: () => fetchEquipmentById(id),
      },
      {
        queryKey: queryKeys.equipmentLogs(id),
        queryFn: () => fetchEquipmentLogs(id),
      },
    ],
  });

  const [equipmentQuery, logsQuery] = results;
  const isLoading = equipmentQuery.isLoading || logsQuery.isLoading;
  const isError = equipmentQuery.isError || logsQuery.isError;

  return {
    equipment: equipmentQuery.data ?? null,
    logs: logsQuery.data ?? [],
    isLoading,
    isError,
    refetch: () => {
      equipmentQuery.refetch();
      logsQuery.refetch();
    },
  };
}

export function useAllEquipmentLogs() {
  return useQuery({
    queryKey: queryKeys.allEquipmentLogs,
    queryFn: fetchAllEquipmentLogs,
  });
}

import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardStats,
  fetchEquipmentByCategory,
  fetchEventsByMonth,
  fetchTopEquipment,
} from '@logistica/sdk';
import { queryKeys } from '../lib/queryKeys';

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboardStats,
  });
}

export function useEquipmentByCategory() {
  return useQuery({
    queryKey: queryKeys.dashboardEquipmentByCategory,
    queryFn: fetchEquipmentByCategory,
  });
}

export function useEventsByMonth(months: number = 6) {
  return useQuery({
    queryKey: queryKeys.dashboardEventsByMonth(months),
    queryFn: () => fetchEventsByMonth(months),
  });
}

export function useTopEquipment(limit: number = 5) {
  return useQuery({
    queryKey: queryKeys.dashboardTopEquipment(limit),
    queryFn: () => fetchTopEquipment(limit),
  });
}

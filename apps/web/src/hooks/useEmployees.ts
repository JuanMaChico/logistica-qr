import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '@logistica/sdk';
import { queryKeys } from '../lib/queryKeys';
import type { CreateEmployeeInput, UpdateEmployeeInput } from '@logistica/sdk';

export function useEmployeesList() {
  return useQuery({
    queryKey: queryKeys.employees.all,
    queryFn: fetchEmployees,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmployeeInput) => createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: UpdateEmployeeInput }) =>
      updateEmployee(vars.id, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
}

import { apiClient } from '../client';
import type { User } from '@logistica/types';

export interface CreateEmployeeInput {
  name: string;
  email?: string;
  phone?: string;
  pin?: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  phone?: string;
  pin?: string;
}

export interface EmployeeResponse extends Omit<User, 'orgId'> {
  pin?: string;
}

export async function fetchEmployees(): Promise<EmployeeResponse[]> {
  const { data } = await apiClient.get<EmployeeResponse[]>('/employees');
  return data;
}

export async function fetchEmployeeById(id: string): Promise<EmployeeResponse> {
  const { data } = await apiClient.get<EmployeeResponse>(`/employees/${id}`);
  return data;
}

export async function createEmployee(dto: CreateEmployeeInput): Promise<EmployeeResponse> {
  const { data } = await apiClient.post<EmployeeResponse>('/employees', dto);
  return data;
}

export async function updateEmployee(id: string, dto: UpdateEmployeeInput): Promise<EmployeeResponse> {
  const { data } = await apiClient.put<EmployeeResponse>(`/employees/${id}`, dto);
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await apiClient.delete(`/employees/${id}`);
}

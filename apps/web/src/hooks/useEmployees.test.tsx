import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmployeesList, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from './useEmployees';

const mockFetchEmployees = vi.fn();
const mockCreateEmployee = vi.fn();
const mockUpdateEmployee = vi.fn();
const mockDeleteEmployee = vi.fn();

vi.mock('@logistica/sdk', () => ({
  fetchEmployees: (...args: unknown[]) => mockFetchEmployees(...args),
  createEmployee: (...args: unknown[]) => mockCreateEmployee(...args),
  updateEmployee: (...args: unknown[]) => mockUpdateEmployee(...args),
  deleteEmployee: (...args: unknown[]) => mockDeleteEmployee(...args),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useEmployeesList', () => {
  it('should return employees on success', async () => {
    const employees = [{ id: 'u2', name: 'Técnico', email: null, phone: '123', role: 'technician', createdAt: new Date().toISOString() }];
    mockFetchEmployees.mockResolvedValue(employees);

    const { result } = renderHook(() => useEmployeesList(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(employees);
  });

  it('should return error on failure', async () => {
    mockFetchEmployees.mockRejectedValue(new Error('Error'));

    const { result } = renderHook(() => useEmployeesList(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateEmployee', () => {
  it('should call createEmployee with correct data', async () => {
    const input = { name: 'Nuevo', email: 'a@b.com' };
    mockCreateEmployee.mockResolvedValue({ id: 'u3', ...input, role: 'technician', pin: '1234', phone: null, createdAt: new Date().toISOString() });

    const { result } = renderHook(() => useCreateEmployee(), { wrapper });

    await act(async () => {
      const res = await result.current.mutateAsync(input);
      expect(res.pin).toBe('1234');
    });

    expect(mockCreateEmployee).toHaveBeenCalledWith(input);
  });
});

describe('useUpdateEmployee', () => {
  it('should call updateEmployee with correct params', async () => {
    mockUpdateEmployee.mockResolvedValue({ id: 'u2', name: 'Updated' });

    const { result } = renderHook(() => useUpdateEmployee(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'u2', data: { name: 'Updated' } });
    });

    expect(mockUpdateEmployee).toHaveBeenCalledWith('u2', { name: 'Updated' });
  });
});

describe('useDeleteEmployee', () => {
  it('should call deleteEmployee with correct id', async () => {
    mockDeleteEmployee.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteEmployee(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('u2');
    });

    expect(mockDeleteEmployee).toHaveBeenCalledWith('u2');
  });
});

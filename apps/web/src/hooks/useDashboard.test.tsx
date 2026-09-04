import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardStats, useEquipmentByCategory, useEventsByMonth, useTopEquipment } from './useDashboard';

const mockFetchDashboardStats = vi.fn();
const mockFetchEquipmentByCategory = vi.fn();
const mockFetchEventsByMonth = vi.fn();
const mockFetchTopEquipment = vi.fn();

vi.mock('@logistica/sdk', () => ({
  fetchDashboardStats: (...args: unknown[]) => mockFetchDashboardStats(...args),
  fetchEquipmentByCategory: (...args: unknown[]) => mockFetchEquipmentByCategory(...args),
  fetchEventsByMonth: (...args: unknown[]) => mockFetchEventsByMonth(...args),
  fetchTopEquipment: (...args: unknown[]) => mockFetchTopEquipment(...args),
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

describe('useDashboardStats', () => {
  it('should return dashboard stats on success', async () => {
    const stats = { totalEquipment: 10, available: 5, rented: 3, damaged: 1, inRepair: 0, retired: 1, activeEvents: 2, activeRentals: 3 };
    mockFetchDashboardStats.mockResolvedValue(stats);

    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(stats);
  });

  it('should return error on failure', async () => {
    mockFetchDashboardStats.mockRejectedValue(new Error('Error'));

    const { result } = renderHook(() => useDashboardStats(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useEquipmentByCategory', () => {
  it('should return categories on success', async () => {
    const data = [{ category: 'speaker', count: 5 }];
    mockFetchEquipmentByCategory.mockResolvedValue(data);

    const { result } = renderHook(() => useEquipmentByCategory(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe('useEventsByMonth', () => {
  it('should return monthly data on success', async () => {
    const data = [{ month: '2026-01', count: 3 }];
    mockFetchEventsByMonth.mockResolvedValue(data);

    const { result } = renderHook(() => useEventsByMonth(3), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
    expect(mockFetchEventsByMonth).toHaveBeenCalledWith(3);
  });
});

describe('useTopEquipment', () => {
  it('should return top equipment on success', async () => {
    const data = [{ id: 'e1', name: 'Parlante', qrCode: 'EQ-PAR-001', timesUsed: 10 }];
    mockFetchTopEquipment.mockResolvedValue(data);

    const { result } = renderHook(() => useTopEquipment(5), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
    expect(mockFetchTopEquipment).toHaveBeenCalledWith(5);
  });
});

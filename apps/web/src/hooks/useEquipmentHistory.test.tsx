import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEquipmentHistory, useAllEquipmentLogs } from './useEquipmentHistory';

const mockFetchEquipmentById = vi.fn();
const mockFetchEquipmentLogs = vi.fn();
const mockFetchAllEquipmentLogs = vi.fn();

vi.mock('@logistica/sdk', () => ({
  fetchEquipmentById: (...args: unknown[]) => mockFetchEquipmentById(...args),
  fetchEquipmentLogs: (...args: unknown[]) => mockFetchEquipmentLogs(...args),
  fetchAllEquipmentLogs: (...args: unknown[]) => mockFetchAllEquipmentLogs(...args),
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

describe('useEquipmentHistory', () => {
  it('should return equipment and logs on success', async () => {
    const equipment = { id: 'e1', name: 'Parlante', qrCode: 'EQ-PAR-001', category: 'speaker', physicalStatus: 'good', availabilityStatus: 'available', notes: null, createdAt: new Date().toISOString() };
    const logs = [{ id: 'l1', equipmentId: 'e1', eventId: 'evt1', reason: 'Préstamo', registeredById: 'u1', createdAt: new Date().toISOString() }];

    mockFetchEquipmentById.mockResolvedValue(equipment);
    mockFetchEquipmentLogs.mockResolvedValue(logs);

    const { result } = renderHook(() => useEquipmentHistory('e1'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.equipment).toEqual(equipment);
    expect(result.current.logs).toEqual(logs);
    expect(result.current.isError).toBe(false);
  });

  it('should handle errors', async () => {
    mockFetchEquipmentById.mockRejectedValue(new Error('Error'));
    mockFetchEquipmentLogs.mockResolvedValue([]);

    const { result } = renderHook(() => useEquipmentHistory('e1'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(true);
  });

  it('should set equipment to null on failure', async () => {
    mockFetchEquipmentById.mockRejectedValue(new Error('Error'));
    mockFetchEquipmentLogs.mockResolvedValue([]);

    const { result } = renderHook(() => useEquipmentHistory('e1'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.equipment).toBeNull();
    expect(result.current.logs).toEqual([]);
  });
});

describe('useAllEquipmentLogs', () => {
  it('should return all logs on success', async () => {
    const logs = [
      { id: 'l1', equipmentId: 'e1', eventId: 'evt1', reason: 'Roto', registeredById: 'u1', createdAt: new Date().toISOString(), equipment: { id: 'e1', name: 'Parlante', qrCode: 'EQ-PAR-001' } },
    ];
    mockFetchAllEquipmentLogs.mockResolvedValue(logs);

    const { result } = renderHook(() => useAllEquipmentLogs(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(logs);
  });

  it('should return error on failure', async () => {
    mockFetchAllEquipmentLogs.mockRejectedValue(new Error('Error'));

    const { result } = renderHook(() => useAllEquipmentLogs(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

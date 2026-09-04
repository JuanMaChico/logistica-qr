import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEquipmentList, useCreateEquipment, useUpdateEquipment, useDeleteEquipment, useRestoreEquipment } from './useEquipment';

const mockFetchEquipment = vi.fn();
const mockCreateEquipment = vi.fn();
const mockUpdateEquipment = vi.fn();
const mockDeleteEquipment = vi.fn();
const mockRestoreEquipment = vi.fn();

vi.mock('@logistica/sdk', () => ({
  fetchEquipment: (...args: unknown[]) => mockFetchEquipment(...args),
  createEquipment: (...args: unknown[]) => mockCreateEquipment(...args),
  updateEquipment: (...args: unknown[]) => mockUpdateEquipment(...args),
  deleteEquipment: (...args: unknown[]) => mockDeleteEquipment(...args),
  restoreEquipment: (...args: unknown[]) => mockRestoreEquipment(...args),
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

describe('useEquipmentList', () => {
  it('should return equipment list on success', async () => {
    const equipment = [{ id: 'e1', name: 'Parlante', qrCode: 'EQ-PAR-001', category: 'speaker', physicalStatus: 'good', availabilityStatus: 'available', notes: null, createdAt: new Date().toISOString() }];
    mockFetchEquipment.mockResolvedValue(equipment);

    const { result } = renderHook(() => useEquipmentList(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(equipment);
  });

  it('should return error on failure', async () => {
    mockFetchEquipment.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEquipmentList(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateEquipment', () => {
  it('should call createEquipment with correct data', async () => {
    const created = { id: 'e2', name: 'Mic', qrCode: 'EQ-MIC-001', category: 'microphone', physicalStatus: 'good', availabilityStatus: 'available', notes: null, createdAt: new Date().toISOString() };
    mockCreateEquipment.mockResolvedValue(created);

    const { result } = renderHook(() => useCreateEquipment(), { wrapper });

    await act(async () => {
      const res = await result.current.mutateAsync({ name: 'Mic', category: 'microphone' });
      expect(res).toEqual(created);
    });

    expect(mockCreateEquipment).toHaveBeenCalledWith({ name: 'Mic', category: 'microphone' });
  });
});

describe('useUpdateEquipment', () => {
  it('should call updateEquipment with correct params', async () => {
    mockUpdateEquipment.mockResolvedValue({ id: 'e1', name: 'Updated' });

    const { result } = renderHook(() => useUpdateEquipment(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'e1', data: { name: 'Updated' } });
    });

    expect(mockUpdateEquipment).toHaveBeenCalledWith('e1', { name: 'Updated' });
  });
});

describe('useDeleteEquipment', () => {
  it('should call deleteEquipment with correct id', async () => {
    mockDeleteEquipment.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteEquipment(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('e1');
    });

    expect(mockDeleteEquipment).toHaveBeenCalledWith('e1');
  });
});

describe('useRestoreEquipment', () => {
  it('should call restoreEquipment with correct id', async () => {
    mockRestoreEquipment.mockResolvedValue({ id: 'e1', availabilityStatus: 'available' });

    const { result } = renderHook(() => useRestoreEquipment(), { wrapper });

    await act(async () => {
      const res = await result.current.mutateAsync('e1');
      expect(res.availabilityStatus).toBe('available');
    });

    expect(mockRestoreEquipment).toHaveBeenCalledWith('e1');
  });
});

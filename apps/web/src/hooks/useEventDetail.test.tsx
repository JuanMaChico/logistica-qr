import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEventDetail, useCloseEvent, useRetireEquipment, useUndoCheckout, useUpdateEvent } from './useEventDetail';

const mockFetchEventById = vi.fn();
const mockCloseEvent = vi.fn();
const mockRetireEquipment = vi.fn();
const mockUndoCheckoutFn = vi.fn();
const mockUpdateEvent = vi.fn();

vi.mock('@logistica/sdk', () => ({
  fetchEventById: (...args: unknown[]) => mockFetchEventById(...args),
  closeEvent: (...args: unknown[]) => mockCloseEvent(...args),
  retireEquipment: (...args: unknown[]) => mockRetireEquipment(...args),
  undoCheckout: (...args: unknown[]) => mockUndoCheckoutFn(...args),
  updateEvent: (...args: unknown[]) => mockUpdateEvent(...args),
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

describe('useEventDetail', () => {
  it('should return event detail on success', async () => {
    const detail = { id: 'evt1', name: 'Fiesta', type: 'party', clientName: 'C', departureDate: new Date().toISOString(), returnDate: new Date().toISOString(), status: 'pending', createdById: 'u1', createdAt: new Date().toISOString(), clientPhone: null, clientAddress: null, notes: null, createdBy: { id: 'u1', name: 'Admin' }, rentals: [] };
    mockFetchEventById.mockResolvedValue(detail);

    const { result } = renderHook(() => useEventDetail('evt1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(detail);
    expect(mockFetchEventById).toHaveBeenCalledWith('evt1');
  });

  it('should return error on failure', async () => {
    mockFetchEventById.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useEventDetail('evt1'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCloseEvent', () => {
  it('should call closeEvent with event id', async () => {
    mockCloseEvent.mockResolvedValue({ message: 'Evento cerrado' });

    const { result } = renderHook(() => useCloseEvent(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('evt1');
    });

    expect(mockCloseEvent).toHaveBeenCalledWith('evt1');
  });
});

describe('useRetireEquipment', () => {
  it('should call retireEquipment with correct params', async () => {
    mockRetireEquipment.mockResolvedValue({ availabilityStatus: 'retired' });

    const { result } = renderHook(() => useRetireEquipment(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ equipmentId: 'e1', reason: 'Roto', eventId: 'evt1' });
    });

    expect(mockRetireEquipment).toHaveBeenCalledWith('e1', 'Roto', 'evt1');
  });
});

describe('useUndoCheckout', () => {
  it('should call undoCheckout with correct params', async () => {
    mockUndoCheckoutFn.mockResolvedValue({ message: 'Checkout revertido' });

    const { result } = renderHook(() => useUndoCheckout(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ eventId: 'evt1', itemId: 'ri1' });
    });

    expect(mockUndoCheckoutFn).toHaveBeenCalledWith('evt1', 'ri1');
  });
});

describe('useUpdateEvent', () => {
  it('should call updateEvent with correct params', async () => {
    mockUpdateEvent.mockResolvedValue({ id: 'evt1', name: 'Updated' });

    const { result } = renderHook(() => useUpdateEvent(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 'evt1', data: { name: 'Updated' } });
    });

    expect(mockUpdateEvent).toHaveBeenCalledWith('evt1', { name: 'Updated' });
  });

  it('should propagate 409 conflict error', async () => {
    const conflictError = new Error('Conflict') as Error & { response: { status: number; data: { message: string } } };
    conflictError.response = {
      status: 409,
      data: { message: 'El evento se superpone con: "Otro Evento". Revisá las fechas.' },
    };
    mockUpdateEvent.mockRejectedValue(conflictError);

    const { result } = renderHook(() => useUpdateEvent(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          id: 'evt1',
          data: { departureDate: '2026-08-01T10:00:00Z', returnDate: '2026-08-10T10:00:00Z' },
        });
      }),
    ).rejects.toThrow('Conflict');
  });
});

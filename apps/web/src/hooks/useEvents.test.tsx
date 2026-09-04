import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEventsList, useCreateEvent, useDeleteEvent } from './useEvents';

const mockFetchEvents = vi.fn();
const mockCreateEvent = vi.fn();
const mockDeleteEvent = vi.fn();

vi.mock('@logistica/sdk', () => ({
  fetchEvents: (...args: unknown[]) => mockFetchEvents(...args),
  createEvent: (...args: unknown[]) => mockCreateEvent(...args),
  deleteEvent: (...args: unknown[]) => mockDeleteEvent(...args),
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

describe('useEventsList', () => {
  it('should return events list on success', async () => {
    const events = [{ id: 'evt1', name: 'Fiesta', type: 'party', clientName: 'C', departureDate: new Date().toISOString(), returnDate: new Date().toISOString(), status: 'pending', createdById: 'u1', createdAt: new Date().toISOString(), clientPhone: null, clientAddress: null, notes: null }];
    mockFetchEvents.mockResolvedValue(events);

    const { result } = renderHook(() => useEventsList(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(events);
  });

  it('should return error on failure', async () => {
    mockFetchEvents.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEventsList(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateEvent', () => {
  it('should call createEvent with correct data', async () => {
    const eventData = { name: 'Nuevo', type: 'party' as const, clientName: 'C', departureDate: '2026-08-01', returnDate: '2026-08-02' };
    mockCreateEvent.mockResolvedValue({ id: 'evt2', ...eventData, status: 'pending', createdById: 'u1', createdAt: new Date().toISOString(), clientPhone: null, clientAddress: null, notes: null });

    const { result } = renderHook(() => useCreateEvent(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(eventData);
    });

    expect(mockCreateEvent).toHaveBeenCalledWith(eventData);
  });

  it('should propagate 409 conflict error', async () => {
    const conflictError = new Error('Conflict') as Error & { response: { status: number; data: { message: string } } };
    conflictError.response = {
      status: 409,
      data: { message: 'El evento se superpone con: "Otro Evento". Revisá las fechas.' },
    };
    mockCreateEvent.mockRejectedValue(conflictError);

    const { result } = renderHook(() => useCreateEvent(), { wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ name: 'Test', type: 'party' as const, clientName: 'C', departureDate: '2026-08-01', returnDate: '2026-08-10' });
      }),
    ).rejects.toThrow('Conflict');
  });
});

describe('useDeleteEvent', () => {
  it('should call deleteEvent with correct id', async () => {
    mockDeleteEvent.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteEvent(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('evt1');
    });

    expect(mockDeleteEvent).toHaveBeenCalledWith('evt1');
  });
});

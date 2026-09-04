import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useScannerEvents, useCheckout, useCheckin } from './useScanner';

const mockFetchEvents = vi.fn();
const mockCheckout = vi.fn();
const mockCheckin = vi.fn();

vi.mock('@logistica/sdk', () => ({
  fetchEvents: (...args: unknown[]) => mockFetchEvents(...args),
  checkout: (...args: unknown[]) => mockCheckout(...args),
  checkin: (...args: unknown[]) => mockCheckin(...args),
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

describe('useScannerEvents', () => {
  it('should return events on success', async () => {
    const events = [{ id: 'evt1', name: 'Fiesta', type: 'party', clientName: 'C', departureDate: new Date().toISOString(), returnDate: new Date().toISOString(), status: 'pending', createdById: 'u1', createdAt: new Date().toISOString(), clientPhone: null, clientAddress: null, notes: null }];
    mockFetchEvents.mockResolvedValue(events);

    const { result } = renderHook(() => useScannerEvents(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(events);
  });
});

describe('useCheckout', () => {
  it('should call checkout with correct params', async () => {
    mockCheckout.mockResolvedValue({ id: 'ri1' });

    const { result } = renderHook(() => useCheckout(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ eventId: 'evt1', qrCode: 'EQ-PAR-001' });
    });

    expect(mockCheckout).toHaveBeenCalledWith('evt1', 'EQ-PAR-001');
  });
});

describe('useCheckin', () => {
  it('should call checkin with correct params', async () => {
    mockCheckin.mockResolvedValue({ id: 'ri1', scannedInAt: new Date().toISOString() });

    const { result } = renderHook(() => useCheckin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ eventId: 'evt1', qrCode: 'EQ-PAR-001', condition: 'good' });
    });

    expect(mockCheckin).toHaveBeenCalledWith('evt1', 'EQ-PAR-001', 'good');
  });

  it('should call checkin without condition', async () => {
    mockCheckin.mockResolvedValue({ id: 'ri1', scannedInAt: new Date().toISOString() });

    const { result } = renderHook(() => useCheckin(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ eventId: 'evt1', qrCode: 'EQ-PAR-001' });
    });

    expect(mockCheckin).toHaveBeenCalledWith('evt1', 'EQ-PAR-001', undefined);
  });
});

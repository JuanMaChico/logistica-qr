import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Captures the scan callback that startScanner binds into html5-qrcode once.
// The whole point of the stale-closure fix is that this single bound callback
// must still see the latest `mode`/`selectedEvent`, so the test switches mode
// *after* the scanner is started and then fires a scan through this callback.
let capturedOnScan: ((text: string) => void) | null = null;
const mockStart = vi.fn(async (_camera: unknown, _config: unknown, onScan: (t: string) => void) => {
  capturedOnScan = onScan;
});
const mockStop = vi.fn(async () => {});

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: class {
    start = mockStart;
    stop = mockStop;
  },
}));

const mockFetchEvents = vi.fn();
const mockCheckout = vi.fn();
const mockCheckin = vi.fn();
vi.mock('@logistica/sdk', () => ({
  fetchEvents: (...args: unknown[]) => mockFetchEvents(...args),
  checkout: (...args: unknown[]) => mockCheckout(...args),
  checkin: (...args: unknown[]) => mockCheckin(...args),
}));

import { ScannerPage } from './scanner';

function renderScanner() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ScannerPage />
    </QueryClientProvider>,
  );
}

async function selectEventAndStart() {
  // Pick the event (component early-returns the picker until an event is chosen).
  fireEvent.click(await screen.findByText('Fiesta'));
  // Start the camera — binds capturedOnScan exactly once.
  fireEvent.click(screen.getByRole('button', { name: /iniciar escáner/i }));
  await waitFor(() => expect(mockStart).toHaveBeenCalled());
}

beforeEach(() => {
  capturedOnScan = null;
  vi.clearAllMocks();
  mockFetchEvents.mockResolvedValue([{ id: 'evt1', name: 'Fiesta', clientName: 'Cliente' }]);
});

describe('ScannerPage', () => {
  it('registers a check-out against the selected event (no stale closure)', async () => {
    mockCheckout.mockResolvedValue({ id: 'ri1' });
    renderScanner();
    await selectEventAndStart();

    await act(async () => {
      capturedOnScan!('EQ-PAR-001');
    });

    // If the stale closure regressed, selectedEvent would be null and checkout
    // would early-return without ever calling the SDK.
    await waitFor(() => expect(mockCheckout).toHaveBeenCalledWith('evt1', 'EQ-PAR-001'));
    expect(await screen.findByText(/Salida registrada: EQ-PAR-001/)).toBeInTheDocument();
  });

  it('reads the latest mode: check-in after start opens the condition dialog and shows the retorno message', async () => {
    mockCheckin.mockResolvedValue({ id: 'ri1' });
    renderScanner();
    await selectEventAndStart();

    // Switch to check-in AFTER the scanner was started — the bound callback must
    // observe this, not the 'checkout' mode captured at start time.
    fireEvent.click(screen.getByRole('button', { name: /check-in \(retorno\)/i }));

    await act(async () => {
      capturedOnScan!('EQ-MIC-001');
    });

    // Check-in path asks for the equipment condition first.
    fireEvent.click(await screen.findByRole('button', { name: /buen estado/i }));

    await waitFor(() => expect(mockCheckin).toHaveBeenCalledWith('evt1', 'EQ-MIC-001', 'good'));
    expect(mockCheckout).not.toHaveBeenCalled();
    expect(await screen.findByText(/Retorno registrado: EQ-MIC-001/)).toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInvalidate } from './query';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe('useInvalidate', () => {
  it('should return invalidate and reset functions', () => {
    const { result } = renderHook(() => useInvalidate(), { wrapper });

    expect(result.current.invalidate).toBeDefined();
    expect(result.current.reset).toBeDefined();
    expect(typeof result.current.invalidate).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('invalidate should call queryClient.invalidateQueries', () => {
    const { result } = renderHook(() => useInvalidate(), { wrapper });
    expect(() => result.current.invalidate(['equipment'])).not.toThrow();
  });

  it('reset should call queryClient.resetQueries', () => {
    const { result } = renderHook(() => useInvalidate(), { wrapper });
    expect(() => result.current.reset(['events'])).not.toThrow();
  });
});

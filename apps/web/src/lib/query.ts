import { useQueryClient } from '@tanstack/react-query';

function useInvalidate() {
  const queryClient = useQueryClient();

  const invalidate = (key: string[]) => {
    return queryClient.invalidateQueries({ queryKey: key });
  };

  const reset = (key: string[]) => {
    return queryClient.resetQueries({ queryKey: key });
  };

  return { invalidate, reset };
}

export { useInvalidate };

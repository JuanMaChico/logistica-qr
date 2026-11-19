import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

/**
 * Invalida las queries del Tablero (stats + charts, todas bajo el prefijo
 * ['dashboard']). Llamar desde cualquier mutación que cambie el estado o el
 * conteo de equipos: alquiler (check-out), devolución (check-in), daño, baja,
 * y alta/edición/borrado de equipos, para que el Tablero refleje el cambio al
 * instante (el staleTime global es de 60s y no refetchea al enfocar la pestaña).
 */
export function invalidateDashboard(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
}

import type { Equipment, EventStatus, PhysicalStatus } from '@logistica/types';

export type StatusTone = 'success' | 'warning' | 'destructive' | 'repair' | 'neutral';

export interface StatusPresentation {
  tone: StatusTone;
  label: string;
}

export function getEquipmentStatus(
  eq: Pick<Equipment, 'availabilityStatus' | 'physicalStatus'>,
): StatusPresentation {
  if (eq.physicalStatus === 'in_repair') {
    return { tone: 'repair', label: 'En reparación' };
  }
  switch (eq.availabilityStatus) {
    case 'available':
      return { tone: 'success', label: 'Disponible' };
    case 'rented':
      return { tone: 'destructive', label: 'Alquilado' };
    case 'retired':
      return { tone: 'neutral', label: 'Dado de baja' };
    default:
      return { tone: 'neutral', label: eq.availabilityStatus };
  }
}

export function getConditionStatus(physicalStatus: PhysicalStatus): StatusPresentation | null {
  if (physicalStatus === 'damaged') {
    return { tone: 'destructive', label: 'Dañado' };
  }
  return null;
}

export function getEventStatus(status: EventStatus): StatusPresentation {
  switch (status) {
    case 'pending':
      return { tone: 'warning', label: 'Reservado' };
    case 'in_progress':
      return { tone: 'success', label: 'En curso' };
    case 'partial_return':
      return { tone: 'warning', label: 'Devolución parcial' };
    case 'completed':
      return { tone: 'neutral', label: 'Completado' };
    default:
      return { tone: 'neutral', label: status };
  }
}

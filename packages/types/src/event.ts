import type { RentalStatus, ReturnCondition } from './rental';

export type EventType = 'party' | 'business_meeting' | 'show' | 'other';
export type EventStatus = 'pending' | 'in_progress' | 'partial_return' | 'completed';

export interface Event {
  id: string;
  name: string;
  type: EventType;
  clientId?: string | null;
  clientName: string;
  clientPhone: string | null;
  clientAddress: string | null;
  departureDate: string;
  returnDate: string;
  status: EventStatus;
  notes: string | null;
  createdById: string;
  createdAt: string;
}

export interface EventDetail extends Event {
  client?: { id: string; name: string; phone: string | null; email: string | null } | null;
  createdBy: { id: string; name: string };
  rentals: EventRental[];
}

export interface EventRental {
  id: string;
  technicianId: string;
  technician: { id: string; name: string };
  departureDate: string;
  returnDate: string;
  actualReturnDate: string | null;
  status: RentalStatus;
  notes: string | null;
  items: EventRentalItem[];
}

export interface EventRentalItem {
  id: string;
  rentalId: string;
  equipmentId: string;
  scannedOutAt: string;
  scannedInAt: string | null;
  returnCondition: ReturnCondition | null;
  returnNotes: string | null;
  equipment: {
    id: string;
    name: string;
    qrCode: string;
    category: string;
    physicalStatus: string;
    availabilityStatus: string;
  };
}

export interface EventCounts {
  count?: number;
  pending?: number;
  in_progress?: number;
  partial_return?: number;
  completed?: number;
}

export interface CreateEvent {
  name: string;
  type: EventType;
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  clientAddress?: string;
  departureDate: string;
  returnDate: string;
  technicianId?: string;
  notes?: string;
  equipmentIds?: string[];
}

export interface UpdateEvent {
  name?: string;
  type?: EventType;
  clientId?: string | null;
  clientName?: string;
  clientPhone?: string | null;
  clientAddress?: string | null;
  departureDate?: string;
  returnDate?: string;
  notes?: string | null;
}

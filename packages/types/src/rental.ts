export type RentalStatus = 'reserved' | 'active' | 'returned';
export type ReturnCondition = 'good' | 'damaged';

export interface Rental {
  id: string;
  eventId: string;
  technicianId: string;
  departureDate: string;
  returnDate: string;
  actualReturnDate: string | null;
  status: RentalStatus;
  notes: string | null;
  items: RentalItem[];
}

export interface CreateRental {
  eventId: string;
  technicianId: string;
  departureDate: string;
  returnDate: string;
  equipmentIds: string[];
  notes?: string;
}

export interface RentalItem {
  id: string;
  rentalId: string;
  equipmentId: string;
  scannedOutAt: string;
  scannedInAt: string | null;
  returnCondition: ReturnCondition | null;
  returnNotes: string | null;
}

export interface CheckoutInput {
  equipmentIds: string[];
  notes?: string;
}

export interface CheckinInput {
  equipmentId: string;
  condition?: ReturnCondition;
  notes?: string;
}

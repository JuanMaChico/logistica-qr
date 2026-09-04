export type EquipmentCategory = 'speaker' | 'microphone' | 'cable' | 'screen' | 'other';
export type PhysicalStatus = 'good' | 'damaged' | 'in_repair';
export type AvailabilityStatus = 'available' | 'rented' | 'retired';

export interface Equipment {
  id: string;
  qrCode: string;
  qrImage?: string;
  name: string;
  category: EquipmentCategory;
  physicalStatus: PhysicalStatus;
  availabilityStatus: AvailabilityStatus;
  notes: string | null;
  createdAt: string;
}

export interface CreateEquipment {
  name: string;
  category: EquipmentCategory;
  physicalStatus?: PhysicalStatus;
  notes?: string;
}

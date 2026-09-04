export interface DashboardStats {
  totalEquipment: number;
  available: number;
  rented: number;
  damaged: number;
  inRepair: number;
  retired: number;
  activeEvents: number;
  activeRentals: number;
}

export interface EquipmentByCategory {
  category: string;
  count: number;
}

export interface EventsByMonth {
  month: string;
  count: number;
}

export interface TopEquipment {
  id: string;
  name: string;
  qrCode: string;
  timesUsed: number;
}

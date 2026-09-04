export interface EquipmentLog {
  id: string;
  equipmentId: string;
  eventId: string;
  reason: string;
  registeredById: string;
  createdAt: string;
  event?: { id: string; name: string };
  registrar?: { id: string; name: string };
  equipment?: { id: string; name: string; qrCode: string };
}

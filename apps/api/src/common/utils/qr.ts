import * as QRCode from 'qrcode';
import type { EquipmentCategory } from '@prisma/client';

const CATEGORY_PREFIX: Record<EquipmentCategory, string> = {
  speaker: 'PAR',
  microphone: 'MIC',
  screen: 'PAN',
  cable: 'XLR',
  other: 'OTR',
};

export function generateQrCode(category: EquipmentCategory, seq: number): string {
  const prefix = CATEGORY_PREFIX[category];
  const padded = String(seq).padStart(3, '0');
  return `EQ-${prefix}-${padded}`;
}

export async function generateQrImage(code: string): Promise<string> {
  return QRCode.toDataURL(code, { width: 300, margin: 2 });
}

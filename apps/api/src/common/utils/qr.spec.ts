import { generateQrCode } from './qr';

describe('generateQrCode', () => {
  it('should generate QR code for speaker', () => {
    expect(generateQrCode('speaker', 1)).toBe('EQ-PAR-001');
  });

  it('should generate QR code for microphone', () => {
    expect(generateQrCode('microphone', 10)).toBe('EQ-MIC-010');
  });

  it('should generate QR code for screen', () => {
    expect(generateQrCode('screen', 100)).toBe('EQ-PAN-100');
  });

  it('should generate QR code for cable', () => {
    expect(generateQrCode('cable', 250)).toBe('EQ-XLR-250');
  });

  it('should generate QR code for other', () => {
    expect(generateQrCode('other', 999)).toBe('EQ-OTR-999');
  });

  it('should pad sequence with leading zeros', () => {
    expect(generateQrCode('speaker', 0)).toBe('EQ-PAR-000');
  });
});

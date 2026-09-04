import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import type { AuthResponse, DashboardStats, EquipmentByCategory, EventsByMonth, TopEquipment, Equipment, Event, EventDetail, EquipmentLog } from '@logistica/types';

const base = 'http://localhost:3000/api';

export const handlers = [
  http.post(`${base}/auth/register`, () => {
    return HttpResponse.json<AuthResponse>({
      token: 'jwt-register',
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'owner', phone: null, orgId: 'o1', createdAt: new Date().toISOString() },
    });
  }),

  http.post(`${base}/auth/login`, () => {
    return HttpResponse.json<AuthResponse>({
      token: 'jwt-token',
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'owner', phone: null, orgId: 'o1', createdAt: new Date().toISOString() },
    });
  }),

  http.post(`${base}/auth/pin-login`, () => {
    return HttpResponse.json<AuthResponse>({
      token: 'jwt-pin',
      user: { id: 'u2', name: 'Técnico', email: null, role: 'technician', phone: '123', orgId: 'o1', createdAt: new Date().toISOString() },
    });
  }),

  http.get(`${base}/auth/profile`, () => {
    return HttpResponse.json({
      id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'owner', phone: null, orgId: 'o1',
    });
  }),

  http.get(`${base}/dashboard/stats`, () => {
    return HttpResponse.json<DashboardStats>({
      totalEquipment: 10, available: 5, rented: 3, damaged: 1, inRepair: 0, retired: 1, activeEvents: 2, activeRentals: 3,
    });
  }),

  http.get(`${base}/dashboard/equipment-by-category`, () => {
    return HttpResponse.json<EquipmentByCategory[]>([
      { category: 'speaker', count: 5 },
      { category: 'microphone', count: 3 },
      { category: 'cable', count: 2 },
    ]);
  }),

  http.get(`${base}/dashboard/events-by-month`, () => {
    return HttpResponse.json<EventsByMonth[]>([
      { month: '2026-01', count: 3 },
      { month: '2026-02', count: 5 },
      { month: '2026-03', count: 2 },
    ]);
  }),

  http.get(`${base}/dashboard/top-equipment`, () => {
    return HttpResponse.json<TopEquipment[]>([
      { id: 'e1', name: 'Parlante', qrCode: 'EQ-PAR-001', timesUsed: 10 },
      { id: 'e2', name: 'Micrófono', qrCode: 'EQ-MIC-001', timesUsed: 7 },
    ]);
  }),

  http.get(`${base}/equipment/logs`, () => {
    return HttpResponse.json<EquipmentLog[]>([
      { id: 'l1', equipmentId: 'e1', eventId: 'evt1', reason: 'Roto durante evento', registeredById: 'u1', createdAt: new Date().toISOString(), event: { id: 'evt1', name: 'Fiesta' }, registrar: { id: 'u1', name: 'Admin' }, equipment: { id: 'e1', name: 'Parlante', qrCode: 'EQ-PAR-001' } },
      { id: 'l2', equipmentId: 'e2', eventId: 'evt1', reason: 'Dañado', registeredById: 'u1', createdAt: new Date().toISOString(), event: { id: 'evt1', name: 'Fiesta' }, registrar: { id: 'u1', name: 'Admin' }, equipment: { id: 'e2', name: 'Otro', qrCode: 'EQ-OTR-001' } },
    ]);
  }),

  http.get(`${base}/equipment`, () => {
    return HttpResponse.json<Equipment[]>([
      { id: 'e1', qrCode: 'EQ-PAR-001', name: 'Parlante', category: 'speaker', physicalStatus: 'good', availabilityStatus: 'available', notes: null, createdAt: new Date().toISOString() },
    ]);
  }),

  http.get(`${base}/equipment/:id`, ({ params }) => {
    return HttpResponse.json<Equipment>({
      id: params['id'] as string, qrCode: 'EQ-PAR-001', name: 'Parlante', category: 'speaker', physicalStatus: 'good', availabilityStatus: 'available', notes: null, createdAt: new Date().toISOString(),
    });
  }),

  http.post(`${base}/equipment`, () => {
    return HttpResponse.json<Equipment>({
      id: 'e-new', qrCode: 'EQ-PAR-002', name: 'Nuevo', category: 'speaker', physicalStatus: 'good', availabilityStatus: 'available', notes: null, createdAt: new Date().toISOString(),
    });
  }),

  http.put(`${base}/equipment/:id`, ({ params }) => {
    return HttpResponse.json<Equipment>({
      id: params['id'] as string, qrCode: 'EQ-PAR-001', name: 'Updated', category: 'speaker', physicalStatus: 'good', availabilityStatus: 'available', notes: null, createdAt: new Date().toISOString(),
    });
  }),

  http.delete(`${base}/equipment/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${base}/equipment/:id/retire`, ({ params }) => {
    return HttpResponse.json<Equipment>({
      id: params['id'] as string, qrCode: 'EQ-PAR-001', name: 'Parlante', category: 'speaker', physicalStatus: 'good', availabilityStatus: 'retired', notes: 'Roto', createdAt: new Date().toISOString(),
    });
  }),

  http.post(`${base}/equipment/:id/restore`, ({ params }) => {
    return HttpResponse.json<Equipment>({
      id: params['id'] as string, qrCode: 'EQ-PAR-001', name: 'Parlante', category: 'speaker', physicalStatus: 'good', availabilityStatus: 'available', notes: null, createdAt: new Date().toISOString(),
    });
  }),

  http.get(`${base}/equipment/:id/logs`, () => {
    return HttpResponse.json<EquipmentLog[]>([
      { id: 'l1', equipmentId: 'e1', eventId: 'evt1', reason: 'Roto durante evento', registeredById: 'u1', createdAt: new Date().toISOString() },
    ]);
  }),

  http.get(`${base}/events`, () => {
    return HttpResponse.json<Event[]>([
      { id: 'evt1', name: 'Fiesta', type: 'party', clientName: 'Cliente', clientPhone: null, clientAddress: null, departureDate: new Date().toISOString(), returnDate: new Date().toISOString(), status: 'pending', notes: null, createdById: 'u1', createdAt: new Date().toISOString() },
    ]);
  }),

  http.get(`${base}/events/:id`, ({ params }) => {
    return HttpResponse.json<EventDetail>({
      id: params['id'] as string, name: 'Fiesta', type: 'party', clientName: 'Cliente', clientPhone: null, clientAddress: null, departureDate: new Date().toISOString(), returnDate: new Date().toISOString(), status: 'pending', notes: null, createdById: 'u1', createdAt: new Date().toISOString(),
      createdBy: { id: 'u1', name: 'Admin' },
      rentals: [],
    });
  }),

  http.post(`${base}/events`, () => {
    return HttpResponse.json<Event>({
      id: 'evt-new', name: 'Nuevo Evento', type: 'party', clientName: 'Cliente', clientPhone: null, clientAddress: null, departureDate: new Date().toISOString(), returnDate: new Date().toISOString(), status: 'pending', notes: null, createdById: 'u1', createdAt: new Date().toISOString(),
    });
  }),

  http.put(`${base}/events/:id`, ({ params }) => {
    return HttpResponse.json<Event>({
      id: params['id'] as string, name: 'Updated', type: 'party', clientName: 'Cliente', clientPhone: null, clientAddress: null, departureDate: new Date().toISOString(), returnDate: new Date().toISOString(), status: 'pending', notes: null, createdById: 'u1', createdAt: new Date().toISOString(),
    });
  }),

  http.delete(`${base}/events/:id`, () => new HttpResponse(null, { status: 204 })),

  http.post(`${base}/events/:id/checkout`, () => {
    return HttpResponse.json({ id: 'ri1', rentalId: 'r1', equipmentId: 'e1', scannedOutAt: new Date().toISOString() });
  }),

  http.post(`${base}/events/:id/checkin`, () => {
    return HttpResponse.json({ id: 'ri1', rentalId: 'r1', equipmentId: 'e1', scannedOutAt: new Date().toISOString(), scannedInAt: new Date().toISOString() });
  }),

  http.post(`${base}/events/:eventId/rental-items/:itemId/undo-checkout`, () => {
    return HttpResponse.json({ message: 'Checkout revertido correctamente' });
  }),

  http.post(`${base}/events/:id/close`, () => {
    return HttpResponse.json({ message: 'Evento cerrado correctamente' });
  }),

  http.get(`${base}/employees`, () => {
    return HttpResponse.json([
      { id: 'u2', name: 'Técnico', email: null, phone: '123', role: 'technician', createdAt: new Date().toISOString() },
    ]);
  }),

  http.get(`${base}/employees/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params['id'] as string, name: 'Técnico', email: null, phone: '123', role: 'technician', createdAt: new Date().toISOString(),
    });
  }),

  http.post(`${base}/employees`, () => {
    return HttpResponse.json({
      id: 'u-new', name: 'Nuevo Técnico', email: null, phone: null, role: 'technician', createdAt: new Date().toISOString(), pin: '1234',
    });
  }),

  http.put(`${base}/employees/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params['id'] as string, name: 'Updated', email: null, phone: null, role: 'technician', createdAt: new Date().toISOString(),
    });
  }),

  http.delete(`${base}/employees/:id`, () => new HttpResponse(null, { status: 204 })),
];

export const server = setupServer(...handlers);

import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import { server } from './setup';
import { setBaseUrl } from '../client';
import {
  login, pinLogin, register, getProfile,
} from '../adapters/auth';
import { fetchDashboardStats, fetchEquipmentByCategory, fetchEventsByMonth, fetchTopEquipment } from '../adapters/dashboard';
import {
  fetchEquipment, fetchEquipmentById, createEquipment, updateEquipment, deleteEquipment,
  retireEquipment, fetchEquipmentLogs, fetchAllEquipmentLogs, restoreEquipment,
} from '../adapters/equipment';
import {
  fetchEvents, fetchEventById, createEvent, updateEvent, deleteEvent,
} from '../adapters/events';
import { checkout, checkin, undoCheckout, closeEvent } from '../adapters/rentals';
import {
  fetchEmployees, fetchEmployeeById, createEmployee, updateEmployee, deleteEmployee,
} from '../adapters/employees';

beforeAll(() => {
  server.listen();
  setBaseUrl('http://localhost:3000/api');
});

afterAll(() => server.close());

afterEach(() => server.resetHandlers());

describe('auth adapters', () => {
  it('login returns auth response', async () => {
    const res = await login({ email: 'admin@test.com', password: '123456' });
    expect(res.token).toBe('jwt-token');
    expect(res.user.role).toBe('owner');
  });

  it('pinLogin returns auth response', async () => {
    const res = await pinLogin({ pin: '1234' });
    expect(res.token).toBe('jwt-pin');
    expect(res.user.role).toBe('technician');
  });

  it('register returns auth response', async () => {
    const res = await register({ organizationName: 'Org', slug: 'org', name: 'Admin', email: 'a@b.com', password: '123456' });
    expect(res.token).toBe('jwt-register');
  });

  it('getProfile returns user data', async () => {
    const res = await getProfile();
    expect(res.id).toBe('u1');
  });
});

describe('dashboard adapter', () => {
  it('fetchDashboardStats returns stats', async () => {
    const stats = await fetchDashboardStats();
    expect(stats.totalEquipment).toBe(10);
    expect(stats.available).toBe(5);
  });

  it('fetchEquipmentByCategory returns categories', async () => {
    const data = await fetchEquipmentByCategory();
    expect(data).toHaveLength(3);
    expect(data[0]!.category).toBe('speaker');
  });

  it('fetchEventsByMonth returns monthly data', async () => {
    const data = await fetchEventsByMonth(3);
    expect(data).toHaveLength(3);
    expect(data[0]!.month).toBe('2026-01');
  });

  it('fetchTopEquipment returns top used equipment', async () => {
    const data = await fetchTopEquipment(5);
    expect(data).toHaveLength(2);
    expect(data[0]!.name).toBe('Parlante');
  });
});

describe('equipment adapters', () => {
  it('fetchEquipment returns list', async () => {
    const list = await fetchEquipment();
    expect(list).toHaveLength(1);
    expect(list[0]!.name).toBe('Parlante');
  });

  it('fetchEquipmentById returns single item', async () => {
    const item = await fetchEquipmentById('e1');
    expect(item.id).toBe('e1');
  });

  it('createEquipment returns created item', async () => {
    const item = await createEquipment({ name: 'Nuevo', category: 'speaker' });
    expect(item.name).toBe('Nuevo');
  });

  it('updateEquipment returns updated item', async () => {
    const item = await updateEquipment('e1', { name: 'Updated' });
    expect(item.name).toBe('Updated');
  });

  it('deleteEquipment succeeds', async () => {
    await expect(deleteEquipment('e1')).resolves.toBeUndefined();
  });

  it('retireEquipment returns retired item', async () => {
    const item = await retireEquipment('e1', 'Roto', 'evt1');
    expect(item.availabilityStatus).toBe('retired');
  });

  it('fetchEquipmentLogs returns logs', async () => {
    const logs = await fetchEquipmentLogs('e1');
    expect(logs).toHaveLength(1);
    expect(logs[0]!.reason).toBe('Roto durante evento');
  });

  it('fetchAllEquipmentLogs returns global logs', async () => {
    const logs = await fetchAllEquipmentLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0]!.equipment?.name).toBe('Parlante');
    expect(logs[0]!.registrar?.name).toBe('Admin');
  });

  it('restoreEquipment returns restored item', async () => {
    const item = await restoreEquipment('e1');
    expect(item.availabilityStatus).toBe('available');
    expect(item.name).toBe('Parlante');
  });
});

describe('events adapters', () => {
  it('fetchEvents returns list', async () => {
    const list = await fetchEvents();
    expect(list).toHaveLength(1);
  });

  it('fetchEventById returns detail', async () => {
    const detail = await fetchEventById('evt1');
    expect(detail.id).toBe('evt1');
    expect(detail.createdBy).toBeDefined();
  });

  it('createEvent returns created event', async () => {
    const evt = await createEvent({ name: 'Test', type: 'party', clientName: 'C', departureDate: '2026-08-01', returnDate: '2026-08-02' });
    expect(evt.name).toBe('Nuevo Evento');
  });

  it('updateEvent returns updated event', async () => {
    const evt = await updateEvent('evt1', { name: 'Updated' });
    expect(evt.name).toBe('Updated');
  });

  it('deleteEvent succeeds', async () => {
    await expect(deleteEvent('evt1')).resolves.toBeUndefined();
  });
});

describe('rentals adapters', () => {
  it('checkout returns rental item', async () => {
    const result = await checkout('evt1', 'e1');
    expect(result.id).toBe('ri1');
  });

  it('checkin returns rental item', async () => {
    const result = await checkin('evt1', 'e1', 'good');
    expect(result.scannedInAt).toBeDefined();
  });

  it('closeEvent returns success message', async () => {
    const result = await closeEvent('evt1');
    expect(result.message).toBe('Evento cerrado correctamente');
  });

  it('undoCheckout returns success message', async () => {
    const result = await undoCheckout('evt1', 'ri1');
    expect(result.message).toBe('Checkout revertido correctamente');
  });
});

describe('employees adapters', () => {
  it('fetchEmployees returns list', async () => {
    const list = await fetchEmployees();
    expect(list).toHaveLength(1);
  });

  it('fetchEmployeeById returns single', async () => {
    const emp = await fetchEmployeeById('u2');
    expect(emp.name).toBe('Técnico');
  });

  it('createEmployee returns with pin', async () => {
    const emp = await createEmployee({ name: 'Nuevo' });
    expect(emp.pin).toBe('1234');
  });

  it('updateEmployee returns updated', async () => {
    const emp = await updateEmployee('u2', { name: 'Updated' });
    expect(emp.name).toBe('Updated');
  });

  it('deleteEmployee succeeds', async () => {
    await expect(deleteEmployee('u2')).resolves.toBeUndefined();
  });
});

export { apiClient, setBaseUrl } from './client';
export { login, pinLogin, getProfile, register } from './adapters/auth';
export {
  fetchEquipment,
  fetchEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  retireEquipment,
  fetchEquipmentLogs,
  fetchAllEquipmentLogs,
  restoreEquipment,
  fetchAvailableEquipment,
} from './adapters/equipment';
export {
  fetchEvents,
  fetchEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  fetchEventCount,
} from './adapters/events';
export { checkout, checkin, undoCheckout, closeEvent } from './adapters/rentals';
export { fetchDashboardStats, fetchEquipmentByCategory, fetchEventsByMonth, fetchTopEquipment } from './adapters/dashboard';
export {
  fetchEmployees,
  fetchEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from './adapters/employees';
export type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeResponse,
} from './adapters/employees';
export { flags, isEnabled } from './flags';
export type { ApiResponse, PaginatedResponse } from './types';

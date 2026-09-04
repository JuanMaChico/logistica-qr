export const queryKeys = {
  dashboard: ['dashboard'] as const,
  dashboardEquipmentByCategory: ['dashboard', 'equipment-by-category'] as const,
  dashboardEventsByMonth: (months: number) => ['dashboard', 'events-by-month', months] as const,
  dashboardTopEquipment: (limit: number) => ['dashboard', 'top-equipment', limit] as const,
  equipment: { all: ['equipment'] as const, available: ['equipment', 'available'] as const },
  equipmentDetail: (id: string) => ['equipment', id] as const,
  equipmentLogs: (id: string) => ['equipment', id, 'logs'] as const,
  allEquipmentLogs: ['equipment', 'logs'] as const,
  events: {
    all: ['events'] as const,
    count: (status?: string) => ['events', 'count', status] as const,
  },
  eventDetail: (id: string) => ['events', id] as const,
  employees: { all: ['employees'] as const },
};

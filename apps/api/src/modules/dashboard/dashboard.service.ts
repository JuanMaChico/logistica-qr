import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(orgId: string): Promise<DashboardStats> {
    const equipment = await this.prisma.equipment.findMany({
      where: { organizationId: orgId },
      select: { availabilityStatus: true },
    });

    const available = equipment.filter((e) => e.availabilityStatus === 'available').length;
    const rented = equipment.filter((e) => e.availabilityStatus === 'rented').length;
    const retired = equipment.filter((e) => e.availabilityStatus === 'retired').length;

    const damaged = await this.prisma.equipment.count({
      where: { organizationId: orgId, physicalStatus: 'damaged', availabilityStatus: { not: 'retired' } },
    });

    const inRepair = await this.prisma.equipment.count({
      where: { organizationId: orgId, physicalStatus: 'in_repair', availabilityStatus: { not: 'retired' } },
    });

    const activeEvents = await this.prisma.event.count({
      where: { organizationId: orgId, status: { in: ['in_progress', 'partial_return'] } },
    });

    const activeRentals = await this.prisma.rental.count({
      where: { event: { organizationId: orgId }, status: 'active' },
    });

    return {
      totalEquipment: equipment.length,
      available,
      rented,
      damaged,
      inRepair,
      retired,
      activeEvents,
      activeRentals,
    };
  }

  async getEquipmentByCategory(orgId: string): Promise<EquipmentByCategory[]> {
    const equipment = await this.prisma.equipment.findMany({
      where: { organizationId: orgId },
      select: { category: true },
    });

    const map = new Map<string, number>();
    for (const eq of equipment) {
      map.set(eq.category, (map.get(eq.category) ?? 0) + 1);
    }

    return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
  }

  async getEventsByMonth(orgId: string, months: number): Promise<EventsByMonth[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const events = await this.prisma.event.findMany({
      where: { organizationId: orgId, createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const map = new Map<string, number>();
    for (const ev of events) {
      const key = ev.createdAt.toISOString().slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    const result: EventsByMonth[] = [];
    const start = new Date(since.getFullYear(), since.getMonth(), 1);
    const now = new Date();
    const cursor = new Date(start);
    while (cursor <= now) {
      const key = cursor.toISOString().slice(0, 7);
      result.push({ month: key, count: map.get(key) ?? 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return result;
  }

  async getTopEquipment(orgId: string, limit: number): Promise<TopEquipment[]> {
    const items = await this.prisma.rentalItem.groupBy({
      by: ['equipmentId'],
      where: { rental: { event: { organizationId: orgId } } },
      _count: { equipmentId: true },
      orderBy: { _count: { equipmentId: 'desc' } },
      take: limit,
    });

    if (items.length === 0) return [];

    const equipmentIds = items.map((i) => i.equipmentId);
    const equipment = await this.prisma.equipment.findMany({
      where: { id: { in: equipmentIds } },
      select: { id: true, name: true, qrCode: true },
    });

    const eqMap = new Map(equipment.map((e) => [e.id, e]));

    return items.map((item) => {
      const eq = eqMap.get(item.equipmentId);
      return {
        id: item.equipmentId,
        name: eq?.name ?? 'Desconocido',
        qrCode: eq?.qrCode ?? '',
        timesUsed: item._count.equipmentId,
      };
    });
  }
}

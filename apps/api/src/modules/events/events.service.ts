import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { EventStatus } from '@prisma/client';
import type { CreateEventDto } from './dto/create-event.dto';
import type { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  private async validateNoOverlap(
    orgId: string,
    departureDate: Date,
    returnDate: Date,
    excludeEventId?: string,
  ) {
    const overlapping = await this.prisma.event.findFirst({
      where: {
        organizationId: orgId,
        id: excludeEventId ? { not: excludeEventId } : undefined,
        status: { not: 'completed' },
        departureDate: { lt: returnDate },
        returnDate: { gt: departureDate },
      },
      select: { id: true, name: true },
      orderBy: { departureDate: 'asc' },
    });

    if (overlapping) {
      throw new ConflictException(
        `El evento se superpone con: "${overlapping.name}". Revisá las fechas.`,
      );
    }
  }

  async getCount(orgId: string, userId: string, userRole: string, status?: EventStatus) {
    // Technicians only count events they're assigned to (same scope as findAll),
    // so the sidebar badge matches their actual event list.
    const scope =
      userRole === 'owner'
        ? { organizationId: orgId }
        : { organizationId: orgId, rentals: { some: { technicianId: userId } } };

    if (status) {
      const count = await this.prisma.event.count({
        where: { ...scope, status },
      });
      return { count };
    }
    const [pending, in_progress, partial_return, completed] = await Promise.all([
      this.prisma.event.count({ where: { ...scope, status: 'pending' } }),
      this.prisma.event.count({ where: { ...scope, status: 'in_progress' } }),
      this.prisma.event.count({ where: { ...scope, status: 'partial_return' } }),
      this.prisma.event.count({ where: { ...scope, status: 'completed' } }),
    ]);
    return { pending, in_progress, partial_return, completed };
  }

  async findAll(userId: string, userRole: string, orgId: string) {
    const where = userRole === 'owner'
      ? { organizationId: orgId }
      : { organizationId: orgId, rentals: { some: { technicianId: userId } } };

    return this.prisma.event.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, phone: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        rentals: {
          include: {
            technician: { select: { id: true, name: true } },
            items: true,
          },
        },
      },
      orderBy: { departureDate: 'desc' },
    });
  }

  async findOne(id: string, orgId?: string) {
    const where = orgId ? { id, organizationId: orgId } : { id };
    const event = await this.prisma.event.findFirst({
      where,
      include: {
        client: { select: { id: true, name: true, phone: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        rentals: {
          include: {
            technician: { select: { id: true, name: true } },
            items: { include: { equipment: true } },
          },
        },
      },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');
    return event;
  }

  async create(dto: CreateEventDto, createdById: string, orgId: string) {
    const departureDate = new Date(dto.departureDate);
    const returnDate = new Date(dto.returnDate);
    await this.validateNoOverlap(orgId, departureDate, returnDate);

    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          name: dto.name,
          type: dto.type,
          clientId: dto.clientId,
          clientName: dto.clientName,
          clientPhone: dto.clientPhone,
          clientAddress: dto.clientAddress,
          departureDate,
          returnDate,
          notes: dto.notes,
          createdById,
          organizationId: orgId,
        },
      });

      if (dto.equipmentIds && dto.equipmentIds.length > 0) {
        // Los equipos ya quedan con scannedOutAt al crearse (ver RentalItem abajo),
        // así que el rental nace 'active' — no 'reserved' — para que el scanner
        // (checkin/close, que solo buscan rentals 'active') pueda encontrarlo.
        const rental = await tx.rental.create({
          data: {
            eventId: event.id,
            technicianId: createdById,
            departureDate,
            returnDate,
            status: 'active',
          },
        });

        await tx.rentalItem.createMany({
          data: dto.equipmentIds.map((equipmentId) => ({
            rentalId: rental.id,
            equipmentId,
            scannedOutAt: new Date(),
          })),
        });

        await tx.equipment.updateMany({
          where: { id: { in: dto.equipmentIds } },
          data: { availabilityStatus: 'rented' },
        });

        return tx.event.update({
          where: { id: event.id },
          data: { status: 'in_progress' },
        });
      }

      return event;
    });
  }

  async update(id: string, dto: UpdateEventDto, orgId: string) {
    const existing = await this.findOne(id, orgId);
    const departureDate = dto.departureDate !== undefined ? new Date(dto.departureDate) : existing.departureDate;
    const returnDate = dto.returnDate !== undefined ? new Date(dto.returnDate) : existing.returnDate;
    if (dto.departureDate !== undefined || dto.returnDate !== undefined) {
      await this.validateNoOverlap(orgId, departureDate, returnDate, id);
    }
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.clientId !== undefined) data.clientId = dto.clientId;
    if (dto.clientName !== undefined) data.clientName = dto.clientName;
    if (dto.clientPhone !== undefined) data.clientPhone = dto.clientPhone;
    if (dto.clientAddress !== undefined) data.clientAddress = dto.clientAddress;
    if (dto.departureDate !== undefined) data.departureDate = departureDate;
    if (dto.returnDate !== undefined) data.returnDate = returnDate;
    if (dto.notes !== undefined) data.notes = dto.notes;
    return this.prisma.event.update({ where: { id }, data });
  }

  async remove(id: string, orgId: string) {
    const event = await this.findOne(id, orgId);
    const equipmentIds = event.rentals.flatMap((rental) =>
      rental.items.map((item) => item.equipmentId),
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.equipmentLog.updateMany({
        where: { eventId: id },
        data: { eventId: null },
      });
      await tx.rentalItem.deleteMany({ where: { rental: { eventId: id } } });
      await tx.rental.deleteMany({ where: { eventId: id } });
      if (equipmentIds.length > 0) {
        await tx.equipment.updateMany({
          where: { id: { in: equipmentIds }, availabilityStatus: 'rented' },
          data: { availabilityStatus: 'available' },
        });
      }
      return tx.event.delete({ where: { id } });
    });
  }
}

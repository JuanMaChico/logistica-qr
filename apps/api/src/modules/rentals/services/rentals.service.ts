import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CheckoutDto } from '../dto/checkout.dto';
import type { CheckinDto } from '../dto/checkin.dto';

@Injectable()
export class RentalsService {
  constructor(private prisma: PrismaService) {}

  async checkout(eventId: string, dto: CheckoutDto, technicianId: string, orgId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizationId: orgId },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');
    if (event.status === 'completed') {
      throw new BadRequestException('El evento ya está completado');
    }

    const equipment = await this.prisma.equipment.findFirst({
      where: { qrCode: dto.equipmentId, organizationId: orgId },
    });
    if (!equipment) throw new NotFoundException('Equipo no encontrado');
    if (equipment.availabilityStatus !== 'available') {
      throw new ConflictException('El equipo no está disponible');
    }

    const rental = await this.getOrCreateActiveRental(eventId, technicianId);

    const item = await this.prisma.rentalItem.create({
      data: {
        rentalId: rental.id,
        equipmentId: equipment.id,
        scannedOutAt: new Date(),
        returnNotes: dto.notes,
      },
    });

    await this.prisma.equipment.update({
      where: { id: equipment.id },
      data: { availabilityStatus: 'rented' },
    });

    if (event.status === 'pending') {
      await this.prisma.event.update({
        where: { id: eventId },
        data: { status: 'in_progress' },
      });
    }

    return item;
  }

  async checkin(eventId: string, dto: CheckinDto, orgId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizationId: orgId },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');

    const equipment = await this.prisma.equipment.findFirst({
      where: { qrCode: dto.equipmentId, organizationId: orgId },
    });
    if (!equipment) throw new NotFoundException('Equipo no encontrado');

    const rental = await this.prisma.rental.findFirst({
      where: { eventId, status: 'active' },
      include: { items: true },
    });
    if (!rental) throw new NotFoundException('No hay un alquiler activo para este evento');

    const item = rental.items.find((i) => i.equipmentId === equipment.id && !i.scannedInAt);
    if (!item) {
      throw new NotFoundException('El equipo no está registrado como salido en este evento');
    }

    const updatedItem = await this.prisma.rentalItem.update({
      where: { id: item.id },
      data: {
        scannedInAt: new Date(),
        returnCondition: dto.condition,
        returnNotes: dto.notes,
      },
    });

    const newStatus = dto.condition === 'damaged' ? 'damaged' : 'good';
    await this.prisma.equipment.update({
      where: { id: equipment.id },
      data: { availabilityStatus: 'available', physicalStatus: newStatus },
    });

    const allReturned = rental.items.every((i) =>
      i.id === item.id ? true : !!i.scannedInAt,
    );

    if (allReturned) {
      await this.prisma.event.update({
        where: { id: eventId },
        data: { status: 'completed' },
      });
      await this.prisma.rental.update({
        where: { id: rental.id },
        data: { status: 'returned', actualReturnDate: new Date() },
      });
    } else {
      await this.prisma.event.update({
        where: { id: eventId },
        data: { status: 'partial_return' },
      });
    }

    return updatedItem;
  }

  async undoCheckout(eventId: string, itemId: string, orgId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizationId: orgId },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');
    if (event.status === 'completed') {
      throw new BadRequestException('El evento ya está completado');
    }

    const item = await this.prisma.rentalItem.findFirst({
      where: { id: itemId, rental: { eventId } },
      include: { rental: true },
    });
    if (!item) {
      throw new NotFoundException('Item no encontrado en este evento');
    }
    if (item.scannedInAt) {
      throw new BadRequestException('El equipo ya fue devuelto, no se puede desasignar');
    }

    await this.prisma.equipment.update({
      where: { id: item.equipmentId },
      data: { availabilityStatus: 'available' },
    });

    await this.prisma.rentalItem.delete({ where: { id: itemId } });

    const remainingItems = await this.prisma.rentalItem.count({
      where: { rentalId: item.rentalId },
    });

    if (remainingItems === 0) {
      await this.prisma.rental.delete({ where: { id: item.rentalId } });

      const totalItems = await this.prisma.rentalItem.count({
        where: { rental: { eventId } },
      });
      if (totalItems === 0) {
        await this.prisma.event.update({
          where: { id: eventId },
          data: { status: 'pending' },
        });
      }
    }

    return { message: 'Checkout revertido correctamente' };
  }

  async close(eventId: string, orgId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizationId: orgId },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');

    const rental = await this.prisma.rental.findFirst({
      where: { eventId, status: 'active' },
      include: { items: true },
    });

    if (!rental) {
      throw new BadRequestException('No hay un alquiler activo para cerrar');
    }

    const pendingItems = rental.items.filter((i) => !i.scannedInAt);
    if (pendingItems.length > 0) {
      throw new BadRequestException(
        `No se puede cerrar: ${pendingItems.length} equipo(s) sin devolver`,
      );
    }

    await this.prisma.rental.update({
      where: { id: rental.id },
      data: { status: 'returned', actualReturnDate: new Date() },
    });

    await this.prisma.event.update({
      where: { id: eventId },
      data: { status: 'completed' },
    });

    return { message: 'Evento cerrado correctamente' };
  }

  private async getOrCreateActiveRental(eventId: string, technicianId: string) {
    const existing = await this.prisma.rental.findFirst({
      where: { eventId, status: 'active' },
    });
    if (existing) return existing;

    return this.prisma.rental.create({
      data: {
        eventId,
        technicianId,
        departureDate: new Date(),
        returnDate: new Date(),
        status: 'active',
      },
    });
  }
}

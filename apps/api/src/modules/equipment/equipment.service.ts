import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateQrCode, generateQrImage } from '../../common/utils/qr';
import type { EquipmentCategory } from '@prisma/client';
import type { CreateEquipmentDto } from './dto/create-equipment.dto';
import type { UpdateEquipmentDto } from './dto/update-equipment.dto';
import type { RetireEquipmentDto } from './dto/retire-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.equipment.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, orgId: string) {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!equipment) throw new NotFoundException('Equipo no encontrado');
    return equipment;
  }

  async create(dto: CreateEquipmentDto, orgId: string) {
    const seq = await this.nextSeq(dto.category, orgId);
    const qrCode = generateQrCode(dto.category, seq);
    const qrImage = await generateQrImage(qrCode);

    const equipment = await this.prisma.equipment.create({
      data: {
        name: dto.name,
        category: dto.category,
        qrCode,
        notes: dto.notes,
        organizationId: orgId,
      },
    });

    return { ...equipment, qrImage };
  }

  async update(id: string, dto: UpdateEquipmentDto, orgId: string) {
    await this.findOne(id, orgId);
    return this.prisma.equipment.update({ where: { id }, data: dto });
  }

  async remove(id: string, orgId: string) {
    await this.findOne(id, orgId);
    return this.prisma.equipment.delete({ where: { id } });
  }

  async getLogs(id: string, orgId: string) {
    await this.findOne(id, orgId);
    return this.prisma.equipmentLog.findMany({
      where: { equipmentId: id },
      include: {
        event: { select: { id: true, name: true } },
        registrar: { select: { id: true, name: true } },
        equipment: { select: { id: true, name: true, qrCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllLogs(orgId: string) {
    return this.prisma.equipmentLog.findMany({
      where: { equipment: { organizationId: orgId } },
      include: {
        event: { select: { id: true, name: true } },
        registrar: { select: { id: true, name: true } },
        equipment: { select: { id: true, name: true, qrCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async restore(id: string, orgId: string) {
    const equipment = await this.findOne(id, orgId);
    if (equipment.availabilityStatus !== 'retired') {
      throw new ConflictException('El equipo no está dado de baja');
    }
    return this.prisma.equipment.update({
      where: { id },
      data: { availabilityStatus: 'available' },
    });
  }

  async retire(id: string, dto: RetireEquipmentDto, userId: string, orgId: string) {
    const equipment = await this.findOne(id, orgId);
    if (equipment.availabilityStatus === 'retired') {
      throw new ConflictException('El equipo ya está dado de baja');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.equipment.update({
        where: { id },
        data: { availabilityStatus: 'retired' },
      });

      await tx.equipmentLog.create({
        data: {
          equipmentId: id,
          eventId: dto.eventId,
          reason: dto.reason,
          registeredById: userId,
        },
      });

      // If the equipment is checked out (an open rental item), resolve that item
      // so the baja doesn't leave the event with a pending item that can never be
      // returned — otherwise the event stays uncloseable. Mirrors checkin's status
      // transition (see RentalsService.checkin).
      const openItem = await tx.rentalItem.findFirst({
        where: {
          equipmentId: id,
          scannedInAt: null,
          rental: dto.eventId
            ? { eventId: dto.eventId, status: 'active' }
            : { status: 'active' },
        },
        include: { rental: { include: { items: true } } },
      });

      if (openItem) {
        await tx.rentalItem.update({
          where: { id: openItem.id },
          data: {
            scannedInAt: new Date(),
            returnCondition: 'damaged',
            returnNotes: `Dado de baja: ${dto.reason}`,
          },
        });

        const allReturned = openItem.rental.items.every((i) =>
          i.id === openItem.id ? true : !!i.scannedInAt,
        );

        if (allReturned) {
          await tx.rental.update({
            where: { id: openItem.rentalId },
            data: { status: 'returned', actualReturnDate: new Date() },
          });
          await tx.event.update({
            where: { id: openItem.rental.eventId },
            data: { status: 'completed' },
          });
        } else {
          await tx.event.update({
            where: { id: openItem.rental.eventId },
            data: { status: 'partial_return' },
          });
        }
      }

      return updated;
    });
  }

  async findAvailable(orgId: string) {
    return this.prisma.equipment.findMany({
      where: { organizationId: orgId, availabilityStatus: 'available' },
      orderBy: { name: 'asc' },
    });
  }

  private async nextSeq(category: EquipmentCategory, orgId: string): Promise<number> {
    const last = await this.prisma.equipment.findFirst({
      where: { category, organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      select: { qrCode: true },
    });

    if (!last) return 1;

    const parts = last.qrCode.split('-');
    return parseInt(parts[2] ?? '0', 10) + 1;
  }
}

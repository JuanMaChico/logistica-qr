import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateEmployeeDto } from './dto/create-employee.dto';
import type { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.user.findMany({
      where: { organizationId: orgId, role: 'technician' },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, orgId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId: orgId, role: 'technician' },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('Técnico no encontrado');
    return user;
  }

  // El PIN se busca globalmente en pinLogin (no hay forma de saber la
  // organización solo con el PIN), así que debe ser único en toda la
  // plataforma — si no, un técnico podría loguearse como uno de otra
  // organización con el mismo PIN. Mismo criterio que el email (ADR-011).
  private async isPinTaken(pin: string, excludeUserId?: string): Promise<boolean> {
    const technicians = await this.prisma.user.findMany({
      where: {
        role: 'technician',
        pin: { not: null },
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { pin: true },
    });

    for (const technician of technicians) {
      if (technician.pin && (await bcrypt.compare(pin, technician.pin))) {
        return true;
      }
    }
    return false;
  }

  async create(dto: CreateEmployeeDto, orgId: string) {
    if (dto.email) {
      const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (exists) {
        if (exists.organizationId === orgId) {
          throw new ConflictException('El email ya está registrado en esta organización');
        }
        throw new ConflictException('El email ya está en uso');
      }
    }

    let pin = dto.pin;
    if (pin) {
      if (await this.isPinTaken(pin)) {
        throw new ConflictException('El PIN ya está en uso, elegí otro');
      }
    } else {
      do {
        pin = String(Math.floor(1000 + Math.random() * 9000));
      } while (await this.isPinTaken(pin));
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    const user = await this.prisma.user.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        pin: hashedPin,
        role: 'technician',
      },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });

    return { ...user, pin };
  }

  async update(id: string, dto: UpdateEmployeeDto, orgId: string) {
    const existing = await this.prisma.user.findFirst({
      where: { id, organizationId: orgId, role: 'technician' },
    });
    if (!existing) throw new NotFoundException('Técnico no encontrado');

    if (dto.email && dto.email !== existing.email) {
      const emailExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (emailExists) throw new ConflictException('El email ya está en uso');
    }

    if (dto.pin !== undefined && (await this.isPinTaken(dto.pin, id))) {
      throw new ConflictException('El PIN ya está en uso, elegí otro');
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.pin !== undefined) data.pin = await bcrypt.hash(dto.pin, 10);

    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });
  }

  async remove(id: string, orgId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId: orgId, role: 'technician' },
    });
    if (!user) throw new NotFoundException('Técnico no encontrado');

    await this.prisma.user.delete({ where: { id } });
  }
}

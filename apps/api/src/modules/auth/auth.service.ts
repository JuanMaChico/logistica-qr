import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) throw new ConflictException('El email ya está registrado');

    const existingSlug = await this.prisma.organization.findUnique({ where: { slug: dto.slug } });
    if (existingSlug) throw new ConflictException('El slug ya está en uso');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const org = await this.prisma.organization.create({
      data: {
        name: dto.organizationName,
        slug: dto.slug,
        users: {
          create: {
            name: dto.name,
            email: dto.email,
            password: hashedPassword,
            role: 'owner',
          },
        },
      },
      include: { users: true },
    });

    const user = org.users[0]!;
    return this.buildResponse(user, org.id);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { organization: { select: { id: true } } },
    });

    if (!user?.password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildResponse(user, user.organization.id);
  }

  async pinLogin(pin: string) {
    const users = await this.prisma.user.findMany({
      where: { role: 'technician', pin: { not: null } },
      include: { organization: { select: { id: true } } },
    });

    for (const user of users) {
      if (user.pin && (await bcrypt.compare(pin, user.pin))) {
        return this.buildResponse(user, user.organization.id);
      }
    }

    throw new UnauthorizedException('PIN inválido');
  }

  private buildResponse(
    user: { id: string; name: string; email: string | null; role: string; phone: string | null },
    orgId: string,
  ) {
    const token = this.jwt.sign({ sub: user.id, role: user.role, orgId });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as 'owner' | 'technician',
        phone: user.phone,
        orgId,
      },
    };
  }
}

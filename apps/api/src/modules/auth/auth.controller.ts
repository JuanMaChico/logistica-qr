import { Controller, Post, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { PinLoginDto } from './dto/pin-login.dto';
import { RegisterDto } from './dto/register.dto';
import { env } from '../../config/env';

// Límite estricto para los endpoints de auth: 5 intentos por minuto por IP,
// para mitigar fuerza bruta (login por password y PIN de 4 dígitos).
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller('auth')
@Throttle(AUTH_THROTTLE)
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    // Auto-registro cerrado salvo que se habilite explícitamente (deploy de una
    // sola empresa). 404 para no revelar la existencia del endpoint.
    if (!env.ALLOW_REGISTRATION) throw new NotFoundException();
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('pin-login')
  @HttpCode(HttpStatus.OK)
  async pinLogin(@Body() dto: PinLoginDto) {
    return this.auth.pinLogin(dto.pin);
  }
}

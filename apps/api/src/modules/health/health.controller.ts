import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  // Liveness liviano para Render/monitoreo. Sin guard y sin tocar la DB a
  // propósito: un chequeo que dependa de Postgres provocaría reinicios ante
  // cualquier blip transitorio de la base.
  @Get()
  check() {
    return { status: 'ok' };
  }
}

import 'dotenv/config';
import { env } from './config/env'; // valida env y hace fail-fast antes de arrancar
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableCors({ origin: env.CORS_ORIGIN });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableShutdownHooks(); // dispara PrismaService.onModuleDestroy ante SIGTERM (Render)

  await app.listen(env.PORT);
}
bootstrap();

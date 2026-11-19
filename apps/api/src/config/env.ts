/**
 * Validación centralizada de variables de entorno. Se importa al tope de main.ts
 * (después de `dotenv/config`) y desde los módulos de auth, de modo que el proceso
 * falle al arrancar si falta una variable crítica, en vez de caer en defaults
 * inseguros (p. ej. un JWT_SECRET 'dev-secret' público o un CORS '*' en prod).
 *
 * DATABASE_URL no se valida acá: Prisma ya falla de forma explícita si no está.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

const isProduction = process.env.NODE_ENV === 'production';

export const env = {
  isProduction,
  JWT_SECRET: required('JWT_SECRET'),
  // En producción el origen de CORS no puede quedar en '*'; en dev se permite el default.
  CORS_ORIGIN: isProduction ? required('CORS_ORIGIN') : (process.env.CORS_ORIGIN ?? '*'),
  PORT: Number(process.env.PORT ?? 3000),
  // Auto-registro de organizaciones. Apagado por defecto (deploy de una sola
  // empresa): el owner se crea por seed. Poner en 'true' para habilitar SaaS.
  ALLOW_REGISTRATION: (process.env.ALLOW_REGISTRATION ?? 'false').toLowerCase() === 'true',
};

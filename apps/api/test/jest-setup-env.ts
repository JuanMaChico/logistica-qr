// Provee variables de entorno deterministas para los tests unitarios, de modo
// que la validación de `src/config/env.ts` (fail-fast en runtime) no rompa los
// specs que instancian módulos de auth. No afecta a producción.
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
// El spec del controller de auth ejercita el happy-path de register.
process.env.ALLOW_REGISTRATION = process.env.ALLOW_REGISTRATION ?? 'true';

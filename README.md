# Logística QR

Sistema de control de inventario con check-in/check-out mediante QR para alquiler de equipos de eventos.

## Stack

- **Frontend:** React 18 + Vite + TanStack Router/Query/Table + TailwindCSS + shadcn/ui + PWA
- **Backend:** NestJS + Prisma + PostgreSQL
- **SDK:** @logistica/sdk (Axios + JWT + adapters tipados)
- **Testing:** Vitest + Testing Library (frontend), Jest (backend), MSW (mock API)
- **QR:** html5-qrcode
- **Monorepo:** pnpm workspaces

## Requisitos

- Node.js 18+
- pnpm 10+
- Docker (para PostgreSQL vía `docker-compose.yml`)

## Inicio rápido

```bash
docker compose up -d          # levanta Postgres (puerto 5432)
pnpm install
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate           # solo la primera vez o tras cambios de schema
pnpm prisma:seed              # crea org "Demo" + admin (admin@logisticaqr.com / admin123)
cd ../..
pnpm dev:all                  # backend (:3000) + frontend (:5173)
```

> `pnpm dev` (sin `:all`) solo levanta el frontend.

## Estructura

```
apps/
  web/          Frontend React
  api/          Backend NestJS + Prisma
packages/
  sdk/          @logistica/sdk (HTTP client compartido)
  types/        Tipos compartidos
```

## Documentación

Ver carpeta `Docs/` en la raíz del proyecto.

- `analisis-logistica-qr.md` — Análisis de flujo, actores, modelo de datos, reglas de negocio
- `MVP-Logistic.md` — Plan MVP, stack, fases de desarrollo
- `plan-implementacion-logistica-qr.md` — Tareas detalladas por fase
- `plan-despliegue-logistica-qr.md` — Estrategia de hosting y CI/CD
- `Value-Proposition-Canvas-LogisticaQR.md` — VPC analysis

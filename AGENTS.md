# Logística QR — Contexto del proyecto

Sistema de control de inventario con check-in/check-out mediante QR para alquiler de equipos de eventos.

## Stack

| Herramienta | Rol |
|---|---|
| pnpm workspaces 10 | Monorepo |
| Vite 6 | Bundler ESM + HMR |
| React 18 | UI Framework |
| TanStack Router | Routing type-safe con guards por rol |
| TanStack Query | Estado servidor (caché, retry, invalidación) |
| TanStack Table | Headless table (sort, filter) |
| TailwindCSS 3 | Utility-first CSS |
| shadcn/ui | Componentes de UI (tema dark/light) |
| @logistica/sdk | Única capa HTTP (Axios + JWT) |
| TypeScript strict | Cero any, tipado punta a punta |
| Vitest + Testing Library | Tests frontend |
| Jest | Tests backend |
| MSW | Mock API en tests |
| NestJS | Backend framework |
| Prisma | ORM + PostgreSQL |
| html5-qrcode | Escaneo QR desde cámara |
| @vite-pwa/vite-plugin | PWA instalable |

## Arquitectura (3 capas)

```
┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐
│   UI     │────▶│  Hook        │────▶│   SDK    │────▶│   Axios  │
│ (React)  │     │ (TanStack Q) │     │ (Adapter)│     │ (Client) │
└──────────┘     └──────────────┘     └──────────┘     └──────────┘
   component         hook             adaptador        petición HTTP
```

**Regla fundamental:** la UI nunca llama a axios o fetch. La UI llama a hooks que llaman al SDK que llama a Axios.

## Convenciones

- **Idioma:** Código en English, UI text en Spanish
- **Nombrado:** camelCase (variables/funciones), PascalCase (componentes/tipos), UPPER_SNAKE_CASE (constantes)
- **Componentes:** separación dumb/smart — smart usa hooks, dumb recibe props
- **Cobertura:** ≥80% obligatorio (bloquea merge)
- **ESLint:** no any, no console.log, no unused vars (excepto _ prefix)
- **JSX requiere extensión .tsx**

## Estructura del proyecto

```
logistica-qr/
├── apps/
│   ├── web/              ← Frontend React
│   └── api/              ← Backend NestJS + Prisma
├── packages/
│   ├── sdk/              ← @logistica/sdk (Axios + adapters)
│   └── types/            ← Tipos compartidos frontend/backend
├── Docs/                 ← Documentación del proyecto (externo al repo)
└── ...
```

## Roles

- **Dueño (Admin):** email + password, acceso full (equipos, eventos, técnicos, escáner, cierre)
- **Técnico:** PIN 4 dígitos, solo eventos asignados + escaneo check-in/out

## Modelo de datos core

- Equipment (id, qrCode, name, category, physicalStatus, availabilityStatus)
- User (id, name, email, password, pin, role, phone)
- Event (id, name, type, clientName, clientPhone, clientAddress, departureDate, returnDate, status)
- Rental (id, eventId, technicianId, departureDate, returnDate, actualReturnDate, status)
- RentalItem (id, rentalId, equipmentId, scannedOutAt, scannedInAt, returnCondition, returnNotes)
- EquipmentLog (id, equipmentId, eventId, reason, registeredById)

## Comandos

```bash
pnpm dev              # Dev server frontend (localhost:5173)
pnpm build            # Build producción
pnpm test             # Tests
pnpm test:coverage    # Tests + cobertura
pnpm lint             # ESLint
pnpm typecheck        # TypeScript en todos los paquetes
pnpm format           # Prettier
```

## Última sesión — 06 Ago 2026

### QA del flujo evento+equipos y fix de borrado
- Probado end-to-end vía API: crear evento con `equipmentIds` → `Rental` (status `active`) → `RentalItem`s → equipos pasan a `rented`. OK.
- Bug encontrado y arreglado: `EventsService.remove()` fallaba con `P2003` (FK) al borrar un evento con equipos asignados. Ahora corre en `$transaction`: nullea `eventId` en `equipment_logs`, borra `rentalItem`s/`rental`s, revierte equipos `rented` → `available`, recién ahí borra el `Event`. Ver ADR-015 en `Docs/decisiones.md`.

### Cobertura de tests backend 52% → 81.23%
- Creados `events.controller.spec.ts`, `auth.controller.spec.ts`, `dashboard.controller.spec.ts`, `rentals.controller.spec.ts`, `employees.controller.spec.ts` (delegación a service vía `TestingModule`).
- Expandido `dashboard.service.spec.ts`: `getEquipmentByCategory`, `getEventsByMonth` (con `jest.useFakeTimers`), `getTopEquipment`.
- Arreglados errores de tipo preexistentes en `packages/api-client/src/__tests__/setup.ts` y `adapters.test.ts`.
- **Todo el monorepo queda verde por primera vez**: `pnpm lint` (0 warnings), `pnpm typecheck` (0 errores), `pnpm test` (96/96 frontend), Jest backend (138/138, cobertura 81.23%).

### Estado real vs checklist de `Docs/MVP-Logistic.md`
- Ya implementado (aunque el registro de sesiones no lo reflejaba): editar equipo desde el listado, desasignar equipo de evento (`undo-checkout`), validación de solapamiento de fechas (`validateNoOverlap`), dashboard con gráficos por categoría/mes/top-equipos.
- Pendiente real: filtro por fecha en el Tablero (disponibilidad futura), QA manual en navegador (no hay browser tool en este entorno), UI/UX polish, decidir si se retoma Entidad Cliente (schema ya preparado).
- El repo sigue sin ningún commit propio (solo el "Initial commit" del template).

### Automatización de contexto
- Creado `CLAUDE.md` en la raíz de Obsidian (fuera del repo) que apunta a este archivo — se autocarga al iniciar sesión en Claude Code.
- Hook `Stop` en `.claude/settings.json` (raíz Obsidian): compara mtimes de `apps/`+`packages/` contra este archivo y pide actualizar la sección "Última sesión" si hay código más nuevo. Ver `.claude/hooks/check-agents-fresh.sh`.

---

## Sesión anterior — 23 Jul 2026

### Feature: Asignar equipos al crear evento
- `CreateEventDto.equipmentIds?: string[]` — array de UUIDs validado
- `EventsService.create()` usa `$transaction`: crea Event → Rental → RentalItems, actualiza equipos a `rented`
- `EquipmentService.findAvailable(orgId)` — equipos con `availabilityStatus: 'available'`
- `GET /equipment/available` endpoint
- SDK `fetchAvailableEquipment()`, hook `useAvailableEquipment()`
- Frontend: selector de equipos con checkboxes agrupados por categoría en form de evento

### Alineación visual con mockup HTML
- `protected.tsx`: sidebar con secciones (Principal/Administración/Operaciones), iconos SVG, badges dinámicos, bottom nav mobile con escáner centrado, user chip con iniciales + rol
- `login.tsx`: tabs Dueño/Técnico, PIN input con auto-focus, colores mockup (`--bg: #0B0D14`, `--surface: #141720`, `--accent: #4F8EF7`, `--scan: #22D3EE`)
- `events.tsx`: chips para tipo de evento, campos Teléfono/Dirección/Notas, selector equipos

### Badge de eventos activos
- `GET /events/count?status=in_progress` — endpoint que devuelve `{count}` o `{pending, in_progress, partial_return, completed}`
- SDK `fetchEventCount(status?)`, hook `useEventCount(status?)`
- Sidebar muestra cantidad real de eventos `in_progress` (oculto si 0)

### Fixes anteriores
- Scanner QR: `rentals.service.ts` buscaba por `id` en vez de `qrCode`
- Módulo Clientes eliminado completo (backend + frontend + SDK + types)

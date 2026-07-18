# Tokin 2.0 — Contexto del proyecto

## Stack

| Herramienta            | Rol                                           |
| ---------------------- | --------------------------------------------- |
| **pnpm workspaces 10** | Monorepo eficiente                            |
| **Vite 6**             | Bundler ESM con HMR nativo                    |
| **React 18**           | UI Framework                                  |
| **TanStack Router**    | Routing type-safe con guards                  |
| **TanStack Query**     | Estado servidor (caché, retry, invalidación)  |
| **TanStack Table**     | Headless table (sort, filter, pagination)     |
| **TailwindCSS 3**      | Utility-first CSS                             |
| **SDK Axios**          | Paquete `@tokin/api-client` — única capa HTTP |
| **TypeScript strict**  | Cero `any`, tipado punta a punta              |
| **Vitest + MSW**       | Tests unitarios y de integración              |

## Arquitectura (3 capas)

```
┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐
│   UI     │────▶│  Hook        │────▶│   SDK    │────▶│   Axios  │
│ (React)  │     │ (TanStack Q) │     │ (Adapter)│     │ (Client) │
└──────────┘     └──────────────┘     └──────────┘     └──────────┘
   component         hook             adaptador        petición HTTP
```

**Regla fundamental:** la UI nunca llama a `axios` o `fetch`. La UI llama a hooks que llaman al SDK que llama a Axios.

## Convenciones clave

- **Idioma:** Código en English, UI text en Spanish
- **Nombrado:** `camelCase` (variables/funciones), `PascalCase` (componentes/tipos), `UPPER_SNAKE_CASE` (constantes)
- **Componentes:** separación dumb/smart — smart usa hooks, dumb recibe props
- **Feature flags:** desactivadas por defecto, se activan en PR separado
- **Cobertura:** ≥80% obligatorio (bloquea merge)
- **ESLint:** no `any`, no `console.log`, no unused vars (excepto `_` prefix)
- **JSX requiere extensión `.tsx`**
- **`explicit-function-return-type`:** deshabilitado para reducir noise

## Estructura del proyecto

```
pruebas tokin/
├── AGENTS.md                  # ← Este archivo (contexto para agentes)
├── .eslintrc.cjs              # Reglas ESLint del equipo
├── .prettierrc                # Formato consistente
├── .husky/pre-commit          # lint-staged automático
├── tsconfig.base.json         # TypeScript strict base (compartido)
├── vitest.config.ts           # Config de tests globales
├── pnpm-workspace.yaml        # Declara los workspaces
├── package.json               # Scripts raíz (dev, test, lint, build)
│
├── apps/web/                  # → Aplicación React
│   ├── vite.config.ts         #   Plugin React + alias @
│   ├── tailwind.config.js     #   Purga CSS en .tsx
│   ├── tsconfig.json          #   Extiende base + jsx: react-jsx
│   └── src/
│       ├── main.tsx           #   Entry point (QueryClient + Router)
│       ├── routes/index.tsx   #   Definición de rutas + layout
│       ├── components/
│       │   ├── OrdersPage.tsx #   Contenedor smart (usa hooks)
│       │   └── OrdersTable.tsx#   Componente puro (recibe props)
│       ├── hooks/
│       │   └── useOrdersQuery.ts  # Hooks CRUD con TanStack Query
│       ├── lib/
│       │   └── query.ts       #   Utilitario useInvalidate
│       └── styles/
│           └── globals.css    #   Directivas Tailwind
│
└── packages/api-client/       # → SDK compartido
    └── src/
        ├── index.ts           #   Barrel (exporta todo)
        ├── client.ts          #   Instancia Axios + interceptores
        ├── flags.ts           #   Feature flags
        ├── types/
        │   ├── order.ts       #   Interfaces de dominio
        │   └── index.ts       #   Genéricos ApiResponse<T>
        └── adapters/
            └── orders.ts      #   Funciones CRUD contra API
```

## QueryClient config

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minuto antes de refetch
      retry: 2, // reintenta 2 veces si falla
      refetchOnWindowFocus: false,
    },
  },
});
```

## Feature flags actuales

```ts
const flags = {
  orders: { enabled: true },
  products: { enabled: false },
} as const;
```

## Progreso

### Done

- [x] Documentación creada: `Documentación Tokin 2.0.md`, `Flujo de trabajo.md`, `Reglas Tokin 2.0.md`, `Guía técnica del stack.md`
- [x] Monorepo inicializado con pnpm workspaces
- [x] Configuración raíz: tsconfig, eslint, prettier, vitest, husky, lint-staged
- [x] SDK `@tokin/api-client`: Axios instance + interceptores (auth token, 401 redirect)
- [x] Feature flags en SDK (`flags.ts`) evaluadas en ruta `beforeLoad`
- [x] Tipos `Order`, `NewOrder`, `UpdateOrderPayload` + genéricos `ApiResponse<T>`, `PaginatedResponse<T>`
- [x] Adaptadores CRUD orders (`getOrders`, `getOrderById`, `createOrder`, `updateOrder`, `deleteOrder`)
- [x] App web: Vite + React 18 + TailwindCSS 3 + TanStack Router/Query/Table
- [x] Rutas: `/` (home), `/orders` (con guardia de feature flag)
- [x] `OrdersPage.tsx`: smart container con loading/error/success + fallback a `SAMPLE_ORDERS`
- [x] `OrdersTable.tsx`: sorting, global filter, pagination, status badges con colores
- [x] `useOrdersQuery.ts`: query `['orders']` + 3 mutations (create, update, delete) con auto-invalidation
- [x] `query.ts`: hook utilitario `useInvalidate`
- [x] Tests: 6 tests pasando (flags: 3, orders adapter con MSW: 2, useOrdersQuery con renderHook: 1)
- [x] ESLint, Husky, lint-staged, Prettier configurados — todos los checks pasan
- [x] README.md publicado con guía técnica completa
- [x] Git repo: `JuanMaChico/prueba-infra-front` (GitHub)
- [x] `setBaseUrl()` exportado del SDK (pendiente de llamar desde la app)

### Next steps

- [ ] MSW handlers en dev (reemplazar `SAMPLE_ORDERS` hardcodeados)
- [ ] Sidebar/Navegación lateral para switchear secciones
- [ ] Sección Products (seguir patrón 8 pasos del README)
- [ ] Sección Users (mismo patrón)
- [ ] CRUD UI (modales create/edit/delete) con mutations de TanStack Query
- [ ] TanStack Query Devtools
- [ ] Optimistic updates en mutations

## Decisiones importantes

| Decisión                                                   | Razón                                                                 |
| ---------------------------------------------------------- | --------------------------------------------------------------------- |
| `pnpm` sobre npm/yarn                                      | Instalaciones más rápidas, protocolo workspace, lockfile determinista |
| SDK como única capa HTTP                                   | UI nunca sabe de fetch/axios — solo hooks → SDK                       |
| `staleTime: 60_000`                                        | Balance entre frescura de datos y evitar llamadas innecesarias        |
| Mutations invalidan `['orders']`                           | Refetch automático post-CRUD sin lógica manual                        |
| Feature flags en SDK, evaluadas en `beforeLoad`            | La ruta ni se renderiza si la flag está apagada                       |
| Dumb/smart separation                                      | `OrdersTable` pura (props), `OrdersPage` imperativa (hooks)           |
| `no-explicit-any: error`                                   | Cero tipos sueltos — todo tipado estrictamente                        |
| Dashboard de un solo archivo de rutas (`routes/index.tsx`) | Simple para empezar; escalable a file-based routing después           |

## Configuración del agente

- **Modelo:** DeepSeek V4 Flash Free (vía OpenRouter)
- **Límite:** 50 requests/día, se resetea cada 24h
- **Claude Code:** instalado y autenticado localmente; plugin `opencode-claude-auth` puede hacer bridge de OAuth
- Comando útil: `/compact` para resumir la sesión cuando se acerca al límite de tokens

## Comandos rápidos

```bash
pnpm dev              # Dev server (localhost:5173)
pnpm build            # Build producción
pnpm test             # Tests
pnpm test:coverage    # Tests + cobertura
pnpm lint             # ESLint (0 warnings)
pnpm typecheck        # TypeScript en todos los paquetes
pnpm format           # Prettier
```

## Archivos relevantes

- `apps/web/src/main.tsx` — Entry point, QueryClient + Router setup
- `apps/web/src/routes/index.tsx` — Route definitions con guardias
- `apps/web/src/components/OrdersPage.tsx` — Smart container (loading/error/success)
- `apps/web/src/components/OrdersTable.tsx` — Table dumb component
- `apps/web/src/hooks/useOrdersQuery.ts` — Query `['orders']` + 3 mutations
- `packages/api-client/src/client.ts` — Axios instance + interceptors
- `packages/api-client/src/adapters/orders.ts` — CRUD functions
- `packages/api-client/src/flags.ts` — Feature flags
- `packages/api-client/src/types/order.ts` — Order interfaces
- `C:\Users\juanchico\Documents\Documentacion-THAdmin\Documentacion Tokin\Documentación Tokin 2.0.md` — Arquitectura general
- `C:\Users\juanchico\Documents\Documentacion-THAdmin\Documentacion Tokin\Flujo de trabajo.md` — Workflow completo
- `C:\Users\juanchico\Documents\Documentacion-THAdmin\Documentacion Tokin\Reglas Tokin 2.0.md` — Reglas de código

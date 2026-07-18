# Monorepo Vite + React + TanStack — Proyecto de Pruebas

> Proyecto de pruebas para validar la arquitectura frontend basada en monorepo pnpm con React 18, Vite 6, ecosistema TanStack (Query, Router, Table) y SDK Axios compartido.

---

## Stack Tecnológico

| Herramienta | Rol |
|---|---|
| **pnpm workspaces** | Monorepo eficiente (~70% menos `node_modules`) |
| **Vite 6** | Bundler ESM, HMR nativo, dev server ~300ms |
| **React 18** | Librería de UI |
| **TanStack Router** | Routing file-based, type-safe, lazy-loading, guardias |
| **TanStack Query** | Caché, retry, invalidación declarativa del estado del servidor |
| **TanStack Table** | Headless, virtualizable, ~30ms por frame con 5.000 filas |
| **TailwindCSS 3** | Utility-first con JIT, bundle CSS mínimo |
| **SDK Axios compartido** | Paquete `@tokin/api-client` con instancia única e interceptores |
| **TypeScript strict** | Contratos tipados de punta a punta, cero `any` |
| **Vitest + MSW** | Tests del SDK a nivel de red y tests de hooks |

---

## Índice

1. [Estructura del proyecto](#1-estructura-del-proyecto)
2. [Flujo de datos completo](#2-flujo-de-datos-completo)
3. [TanStack Query en profundidad](#3-tanstack-query-en-profundidad)
4. [TanStack Router](#4-tanstack-router)
5. [TanStack Table](#5-tanstack-table)
6. [SDK Axios compartido](#6-sdk-axios-compartido)
7. [Feature Flags](#7-feature-flags)
8. [Cómo agregar una nueva feature](#8-cómo-agregar-una-nueva-feature)
9. [Referencia rápida de comandos](#9-referencia-rápida-de-comandos)
10. [Documentación relacionada](#10-documentación-relacionada)

---

## 1. Estructura del proyecto

```
pruebas tokin/
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

### ¿Para qué sirve cada archivo?

#### Raíz del monorepo

| Archivo | Propósito |
|---|---|
| `package.json` | Orquestador. `pnpm dev` inicia la web. `pnpm test` corre todos los tests. `pnpm lint` verifica todo el código. |
| `pnpm-workspace.yaml` | Le dice a pnpm que `apps/*` y `packages/*` son paquetes del monorepo. |
| `tsconfig.base.json` | Configuración TypeScript que heredan todos los paquetes. Centraliza `strict: true` y opciones compartidas. |
| `.eslintrc.cjs` | Reglas que aplican a todo el código: no `any`, no `console.log`, no variables sin usar. |
| `vitest.config.ts` | Configura Vitest con jsdom, cobertura ≥80% y alias `@`. |

#### `apps/web` — La aplicación

| Archivo | Propósito |
|---|---|
| `main.tsx` | Punto de entrada. Crea el `QueryClient` (configuración global de TanStack Query), el `Router` (TanStack Router) y renderiza la app. |
| `routes/index.tsx` | Define el layout (header + contenido) y las rutas. Cada ruta es un objeto con `path`, `component` y `beforeLoad` (opcional). |
| `components/OrdersPage.tsx` | **Contenedor smart.** Llama a `useOrdersQuery()`, maneja los estados (loading, error, success) y le pasa datos a `OrdersTable`. |
| `components/OrdersTable.tsx` | **Componente puro.** No sabe de hooks ni de la API. Recibe `data: Order[]` por props y renderiza una tabla con TanStack Table. |
| `hooks/useOrdersQuery.ts` | Define la query `['orders']` y 3 mutaciones (create, update, delete). Cada mutación invalida la query al completarse. |
| `lib/query.ts` | Hook utilitario `useInvalidate` para invalidar o resetear queries desde cualquier componente. |

#### `packages/api-client` — El SDK

| Archivo | Propósito |
|---|---|
| `client.ts` | Instancia única de Axios. Interceptor de request (adjunta token). Interceptor de response (redirige a login si 401). |
| `flags.ts` | Objeto de feature flags. `isEnabled('orders.enabled')` evalúa si una feature está activa. |
| `types/order.ts` | Interfaces `Order`, `NewOrder`, `UpdateOrderPayload`. Tipo `OrderStatus`. |
| `types/index.ts` | Genéricos `ApiResponse<T>` y `PaginatedResponse<T>` reutilizables. |
| `adapters/orders.ts` | Funciones que llaman a la API. Cada una tipada con el tipo de retorno correspondiente. |

---

## 2. Flujo de datos completo

Cuando un usuario entra a `/orders`, esto es lo que pasa:

```
1. Navegador                         ← usuario escribe /orders
       │
2. TanStack Router                   ← routes/index.tsx
       │  ¿Feature flag activa? → Sí → renderiza OrdersPage
       │
3. OrdersPage (smart component)      ← components/OrdersPage.tsx
       │  Llama a useOrdersQuery()
       │  Mientras carga: muestra <Spinner>
       │  Si error: muestra <ErrorScreen>
       │  Si éxito: pasa data a OrdersTable
       │
4. useOrdersQuery()                  ← hooks/useOrdersQuery.ts
       │  useQuery({ queryKey: ['orders'], queryFn: getOrders })
       │
       │  ┌─── TanStack Query ──────────────────────────┐
       │  │  1. ¿['orders'] en caché?                   │
       │  │    ├─ No  → llama a getOrders()              │
       │  │    └─ Sí  → ¿stale?                          │
       │  │              ├─ No  → sirve caché (0 llamadas)│
       │  │              └─ Sí  → sirve caché + refetch  │
       │  └──────────────────────────────────────────────┘
       │
5. getOrders()                      ← adapters/orders.ts
       │  Llama a apiClient.get('/orders')
       │
6. apiClient                        ← client.ts
       │  Interceptor request: adjunta token de localStorage
       │  → GET /orders con header Authorization
       │
7. API (backend o MSW en tests)
       │  Responde con JSON
       │
8. apiClient                        ← client.ts
       │  Interceptor response: si 401, redirige a /login
       │  → Devuelve respuesta
       │
9. getOrders()                      ← Promise<PaginatedResponse<Order>>
       │  .then(res => res.data)
       │
10. useOrdersQuery()                ← TanStack Query cachea el resultado
       │  data = { data: Order[], total, page, pageSize }
       │
11. OrdersPage                      ← components/OrdersPage.tsx
       │  data?.data ?? SAMPLE_ORDERS
       │  → Pasa array de órdenes a OrdersTable
       │
12. OrdersTable                     ← components/OrdersTable.tsx
       │  Renderiza tabla con sorting, filtros, paginación
```

### Regla fundamental

La UI **nunca** llama a `axios` o `fetch`. La UI llama a hooks que llaman al SDK que llama a Axios.

```
┌──────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐
│   UI     │────▶│  Hook        │────▶│   SDK    │────▶│   Axios  │
│ (React)  │     │ (TanStack Q) │     │ (Adapter)│     │ (Client) │
└──────────┘     └──────────────┘     └──────────┘     └──────────┘
   component         hook             adaptador        petición HTTP
```

Cada capa tiene una responsabilidad única y no se salta a la siguiente.

---

## 3. TanStack Query en profundidad

### 3.1 Concepto fundamental

TanStack Query **no es una librería de fetching**. Es una **librería de estado asíncrono** que gestiona el ciclo de vida de datos que vienen de una fuente externa.

Tú le das:
- Una **queryKey** (`['orders']`) — identifica el dato en caché
- Una **queryFn** (`getOrders`) — función que retorna una promesa

Y TanStack Query se encarga de:
- Cachear el resultado
- Decidir si debe refetch o no
- Manejar loading/error/success
- Reintentar automáticamente
- Mantener datos actualizados en segundo plano

### 3.2 La tríada: QueryKey → QueryFn → QueryClient

#### QueryKey

Es el identificador único en la caché. TanStack Query organiza toda la caché como un mapa de query keys a datos.

```tsx
// Estilo 1: arreglo simple (el que usamos)
['orders']

// Estilo 2: con identificador
['orders', orderId]

// Estilo 3: con filtros
['orders', { status: 'pending', page: 1 }]

// Estilo 4: relacional
['users', userId, 'orders']
```

**Regla:** si dos componentes usan la misma query key, comparten la misma caché y se actualizan juntos.

#### QueryFn

Función que retorna una promesa. Si la promesa se resuelve, los datos se guardan en caché. Si se rechaza, TanStack Query reintenta según `retry` y guarda el error.

```tsx
// En el proyecto:
queryFn: getOrders
// que equivale a:
() => apiClient.get('/orders').then(res => res.data)
// que retorna:
Promise<PaginatedResponse<Order>>
```

#### QueryClient

Manager global que orquesta todas las queries:

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,   // 1 minuto antes de refetch
      retry: 2,             // reintenta 2 veces si falla
      refetchOnWindowFocus: false,
    },
  },
});
```

### 3.3 Ciclo de vida de una query

```tsx
function useOrdersQuery() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });
}
```

1. **Componente se monta** → ejecuta `useQuery`
2. **Busca en caché** si existe `['orders']`
3. **No existe** → `isLoading: true`, `data: undefined`
4. **Ejecuta `queryFn`** → `getOrders()` → `axios.get('/orders')`
5. **Success** → guarda en caché, `isLoading: false`, `data` con los datos
6. **Error** → guarda el error, `isLoading: false`, `error` con el error

### 3.4 staleTime (el concepto más importante)

```tsx
staleTime: 60_000  // 60 segundos
```

Define **cuánto tiempo los datos se consideran "frescos"** después del último fetch.

| Escenario | Sin TanStack Query (useEffect) | Con TanStack Query |
|---|---|---|
| Usuario navega a otra ruta y vuelve a los 30 segundos | Pantalla en blanco mientras carga | Datos instantáneos de caché (sigue fresco) |
| Usuario vuelve a los 90 segundos | Pantalla en blanco mientras carga | Datos instantáneos de caché + refetch silencioso en background |
| 3 componentes en la misma página piden `['orders']` | 3 llamadas a la API | 1 llamada, los otros 2 reciben caché |

**¿Qué pasa después de `staleTime`?** Los datos se marcan como "stale" (obsoletos). La próxima vez que se necesita la query:
1. Se sirve la caché inmediatamente (sin pantalla en blanco)
2. Se dispara un refetch en segundo plano
3. Cuando el refetch termina, se reemplazan los datos **sin flicker**

### 3.5 Retry (reintentos)

```tsx
retry: 2  // reintenta 2 veces antes de dar error
```

Si `getOrders()` falla, TanStack Query reintenta con backoff exponencial:

1. Primer intento → falla → espera ~1 segundo
2. Segundo intento → falla → espera ~2 segundos
3. Tercer intento → falla → `isError: true`

### 3.6 Mutaciones e invalidación

Este es el patrón más importante del proyecto:

```tsx
function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: NewOrder) => createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
```

**¿Qué pasa exactamente cuando se invalida?**

1. TanStack Query marca `['orders']` como **stale = true** (obsoleta)
2. **Si algún componente tiene la query activa** (OrdersPage está montada), automáticamente hace **refetch en segundo plano**
3. **Si ningún componente tiene la query activa**, la próxima vez que alguien monte `useOrdersQuery()` hará fetch porque la caché está obsoleta

**Lo que NO pasa:** no se borra la caché ni se muestra un spinner. La UI sigue mostrando los datos viejos hasta que el refetch termina, y entonces se reemplazan suavemente.

#### Diferencia entre Query y Mutation

| Característica | `useQuery` | `useMutation` |
|---|---|---|
| Propósito | Leer datos | Escribir/actualizar/eliminar |
| Se ejecuta automáticamente | Sí (al montar el componente) | No (solo cuando llamas a `mutate()`) |
| Se cachea | Sí | No |
| Dispara efectos | No | Sí (típicamente invalidar queries) |

### 3.7 Mapa visual de una página con Query

```
OrdersPage (se monta)
     │
     ▼
useOrdersQuery()
     │
     ▼
┌─────────────────────────────────────────────────────┐
│ ¿['orders'] está en caché?                          │
│  ├─ No  → fetch() → guarda en caché → render       │
│  └─ Sí  → ¿stale?                                   │
│             ├─ No  → sirve caché → render           │
│             └─ Sí  → sirve caché → render + refetch │
└─────────────────────────────────────────────────────┘
     │
     ▼
Renderiza ──► OrdersTable(data)  (componente puro)
     │
     ▼
Usuario crea orden
     │
     ▼
useCreateOrder().mutate(payload)
     │
     ▼
POST /orders → success → invalidateQueries(['orders'])
                             │
                             ▼
                     Refetch en background
                             │
                             ▼
                     OrdersTable recibe nuevos datos
```

### 3.8 Lo que TanStack Query te ahorra

| Problema tradicional | Lo que Query resuelve |
|---|---|
| `useEffect` + `setLoading` | `isLoading`, `isSuccess`, `isError` vienen en el objeto |
| `setError` manual | `error.message` viene automático |
| Cache manual | Los datos se cachean por `queryKey` |
| Refetch al volver a la página | `refetchOnMount: true` por defecto |
| Race conditions | Query las maneja internamente |
| Deduplicación | 2 componentes misma key = 1 request |
| Sincronización post-mutación | `invalidateQueries` lo hace automático |

Sin TanStack Query, cada feature sería `useEffect` + `useState` para loading + `useState` para error + `useState` para data + lógica de caché manual + lógica de refetch. **Por feature.** Con TanStack Query son 3 líneas por query.

---

## 4. TanStack Router

### 4.1 Definición de rutas

En `routes/index.tsx`, las rutas se definen de forma declarativa:

```tsx
const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <div className="min-h-screen bg-gray-50">
      <header>...</header>
      <main><Outlet /></main>   {/* ← aquí se renderiza la ruta activa */}
    </div>
  ),
});

const ordersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orders',
  beforeLoad: () => {
    if (!isEnabled('orders.enabled')) {
      throw new Error('Feature not available');
    }
  },
  component: () => <OrdersPage />,
});
```

### 4.2 Guardias con beforeLoad

`beforeLoad` se ejecuta **antes** de renderizar el componente. Si lanza un error, la ruta no se renderiza. Esto permite:

- Validar autenticación
- Verificar feature flags
- Precargar datos

### 4.3 Lazy-loading automático

TanStack Router con Vite genera chunks separados por ruta automáticamente. Esto significa que el código de `/orders` solo se descarga cuando el usuario visita esa ruta. No está en el bundle inicial.

### 4.4 Type-safe

El router infiere los tipos de los parámetros de ruta, el contexto y los datos cargados en `beforeLoad`. Si cambias la forma del contexto, TypeScript te marca todas las rutas que lo usan.

---

## 5. TanStack Table

### 5.1 Headless por diseño

TanStack Table **no renderiza HTML**. Te da la lógica (sorting, filtros, paginación, selección) y tú pones el markup. Esto permite total control visual.

### 5.2 Columnas

```tsx
const columnHelper = createColumnHelper<Order>();

const columns = [
  columnHelper.accessor('customerName', {
    header: 'Customer',
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor('total', {
    header: 'Total',
    cell: (info) => <span>${info.getValue().toFixed(2)}</span>,
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
];
```

### 5.3 Funcionalidades incluidas sin escribir lógica

- **Sorting** por columna (multi-columna si se presiona Shift)
- **Filtro global** (búsqueda en todas las columnas)
- **Filtros por columna** (filtro individual por columna)
- **Paginación** (cliente o servidor)
- **Selección** (checkboxes, multi-selección)
- **Virtualización** (con `@tanstack/react-virtual` para 5.000+ filas)

### 5.4 Performance

Con 5.000 filas, TanStack Table mide ~30ms por frame para sorting y ~45ms para filtro global. Esto es posible porque virtualiza el renderizado: solo renderiza las filas visibles en pantalla.

---

## 6. SDK Axios compartido

### 6.1 Una sola instancia

```tsx
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});
```

**Regla:** nunca se crea otra instancia de Axios. Todos los adaptadores usan `apiClient`.

### 6.2 Interceptores

**Request:** adjunta el token de autenticación automáticamente:

```tsx
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Response:** maneja 401 centralizadamente (toda la app redirige a login):

```tsx
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
```

### 6.3 Adaptadores por dominio

Cada dominio del backend tiene su propio archivo de adaptadores:

```
adapters/
├── orders.ts     # getOrders, getOrderById, createOrder, updateOrder, deleteOrder
├── products.ts   # (futuro) getProducts, getProductById, etc.
└── users.ts      # (futuro) getUsers, getUserById, etc.
```

Cada adaptador es una función pura que retorna una promesa tipada:

```tsx
export function getOrders(): Promise<PaginatedResponse<Order>> {
  return apiClient.get('/orders').then((res) => res.data);
}
```

### 6.4 Contrato tipado

Si el backend cambia la respuesta de `/orders`, solo se actualiza la interfaz `Order` en `types/order.ts`. TypeScript marca todos los lugares que usan `Order` y hay que actualizar. **Cero `any`, cero bugs silenciosos.**

---

## 7. Feature Flags

### 7.1 Definición

```tsx
// packages/api-client/src/flags.ts
const flags = {
  orders: { enabled: true },
  products: { enabled: false },
} as const;
```

### 7.2 Evaluación

```tsx
function isEnabled(flag: string): boolean {
  const path = flag.split('.');
  return Boolean(value);
}
```

### 7.3 Uso en rutas

```tsx
const ordersRoute = createRoute({
  path: '/orders',
  beforeLoad: () => {
    if (!isEnabled('orders.enabled')) {
      throw new Error('Feature not available');
    }
  },
  component: () => <OrdersPage />,
});
```

### 7.4 Flujo de deploy con flags

1. La feature se mergea a `main` con la flag en `false`
2. Se despliega a producción
3. QA valida con la flag activada manualmente
4. Si falla → se desactiva la flag (sin rollback)
5. Si funciona → se activa para todos

---

## 8. Cómo agregar una nueva feature

Este es el patrón para agregar una nueva sección al dashboard (ej: Products).

### Paso 1: Tipos en el SDK

```tsx
// packages/api-client/src/types/product.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

// packages/api-client/src/types/index.ts
export type { Product } from './product';
```

### Paso 2: Adaptador en el SDK

```tsx
// packages/api-client/src/adapters/products.ts
import type { Product } from '../types';
import { apiClient } from '../client';

export function getProducts(): Promise<Product[]> {
  return apiClient.get('/products').then((res) => res.data);
}
```

### Paso 3: Feature flag

```tsx
// packages/api-client/src/flags.ts
const flags = {
  products: { enabled: true },  // ← activar
} as const;
```

### Paso 4: Hook en la app

```tsx
// apps/web/src/hooks/useProductsQuery.ts
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@tokin/api-client';

export function useProductsQuery() {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });
}
```

### Paso 5: Componente presentación

```tsx
// apps/web/src/components/ProductsTable.tsx
import type { Product } from '@tokin/api-client';

interface ProductsTableProps {
  data: Product[];
}

function ProductsTable({ data }: ProductsTableProps) {
  // Renderiza tabla con los datos
}
```

### Paso 6: Página (contenedor)

```tsx
// apps/web/src/components/ProductsPage.tsx
import { useProductsQuery } from '../hooks/useProductsQuery';
import { ProductsTable } from './ProductsTable';

function ProductsPage() {
  const { data, isLoading, error } = useProductsQuery();
  if (isLoading) return <Spinner />;
  if (error) return <ErrorScreen />;
  return <ProductsTable data={data} />;
}
```

### Paso 7: Ruta

```tsx
// apps/web/src/routes/index.tsx
import ProductsPage from '../components/ProductsPage';

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  beforeLoad: () => {
    if (!isEnabled('products.enabled')) throw new Error('Not available');
  },
  component: () => <ProductsPage />,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  ordersRoute,
  productsRoute,  // ← agregar aquí
]);
```

### Paso 8: Tests

```tsx
// Test del adaptador (MSW)
// Test del hook (renderHook + QueryClientProvider)
```

**Cada paso es independiente.** Un junior puede hacer los pasos 1-3, un mid los pasos 4-6, y un senior revisa el paso 7-8.

---

## 9. Referencia rápida de comandos

```bash
pnpm dev              # Inicia servidor de desarrollo (localhost:5173)
pnpm build            # Build de producción
pnpm test             # Corre todos los tests
pnpm test:watch       # Tests en modo watch
pnpm test:coverage    # Tests con reporte de cobertura
pnpm lint             # ESLint (0 warnings permitidos)
pnpm typecheck        # TypeScript en todos los paquetes
pnpm format           # Formatea código con Prettier
pnpm format:check     # Verifica formato sin modificar
```

```bash
# Comandos específicos por paquete
pnpm --filter web dev               # Solo la web
pnpm --filter @tokin/api-client exec tsc --noEmit  # Solo SDK
pnpm --filter web exec vite build   # Build solo web
```

---

## 10. Documentación relacionada

La documentación completa del stack, flujo de trabajo y reglas de código se encuentra en la carpeta de documentación del equipo:

| Documento | Contenido |
|---|---|
| `Documentación Tokin 2.0.md` | Stack, beneficios, métricas, buenas prácticas de equipo |
| `Flujo de trabajo.md` | Proceso de desarrollo: sprint, Jira, QA, PRs, deploy |
| `Reglas Tokin 2.0.md` | Reglas de código: nombrado, componentización, prohibiciones |

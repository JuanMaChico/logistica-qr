import { createRoute, Outlet, useNavigate, redirect, Link, useLocation } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { useAuth } from '../lib/auth';
import { useEventCount } from '../hooks/useEvents';

const ICONS = {
  dashboard: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  events: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  equipment: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  employees: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  scanner: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/>
    </svg>
  ),
  bajas: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const ROLE_LABEL: Record<string, string> = {
  owner: 'Administrador',
  technician: 'Técnico',
};

type NavItem = { label: string; href: string; icon: React.ReactNode; badge?: string | React.ReactNode };

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      to={item.href}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
        active
          ? 'bg-[var(--accent-dim)] text-[var(--accent)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
      }`}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      <span>{item.label}</span>
      {item.badge && (
        <span className="ml-auto text-[11px] font-semibold tabular-nums">{item.badge}</span>
      )}
    </Link>
  );
}

function ProtectedLayout() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: eventCounts } = useEventCount();
  const activeEvents = eventCounts?.in_progress ?? 0;

  const ownerNav: { section: string; items: NavItem[] }[] = [
    {
      section: 'Principal',
      items: [
        { label: 'Tablero', href: '/', icon: ICONS.dashboard },
        {
          label: 'Eventos', href: '/events', icon: ICONS.events,
          badge: activeEvents > 0
            ? <span className="ml-auto rounded-full bg-[var(--red-bg)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--red)]">{activeEvents}</span>
            : undefined,
        },
      ],
    },
    {
      section: 'Administración',
      items: [
        { label: 'Equipos', href: '/equipment', icon: ICONS.equipment },
        { label: 'Técnicos', href: '/employees', icon: ICONS.employees },
      ],
    },
    {
      section: 'Operaciones',
      items: [
        { label: 'Escanear', href: '/scanner', icon: ICONS.scanner, badge: <span className="ml-auto rounded-full bg-[var(--scan-dim)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--scan)]">QR</span> },
        { label: 'Bajas', href: '/bajas', icon: ICONS.bajas },
      ],
    },
  ];

  const techNav: { section: string; items: NavItem[] }[] = [
    {
      section: 'Mis tareas',
      items: [
        {
          label: 'Mis eventos', href: '/events', icon: ICONS.events,
          badge: activeEvents > 0
            ? <span className="ml-auto rounded-full bg-[var(--red-bg)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--red)]">{activeEvents}</span>
            : undefined,
        },
        { label: 'Escanear', href: '/scanner', icon: ICONS.scanner, badge: <span className="ml-auto rounded-full bg-[var(--scan-dim)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--scan)]">QR</span> },
      ],
    },
  ];

  const navSections = auth.user?.role === 'owner' ? ownerNav : techNav;
  const isOwner = auth.user?.role === 'owner';

  const bottomNavItems = isOwner
    ? [
        { label: 'Tablero', href: '/', icon: ICONS.dashboard },
        { label: 'Eventos', href: '/events', icon: ICONS.events, badge: '4' },
        { label: 'Escanear', href: '/scanner', icon: ICONS.scanner, scanner: true },
        { label: 'Equipos', href: '/equipment', icon: ICONS.equipment },
        { label: 'Más', href: '/bajas', icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        )},
      ]
    : [
        { label: 'Eventos', href: '/events', icon: ICONS.events, badge: '2' },
        { label: 'Escanear', href: '/scanner', icon: ICONS.scanner, scanner: true },
      ];

  const initials = auth.user?.name ? getInitials(auth.user.name) : '??';

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <aside className="hidden w-[230px] flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] sm:flex">
        <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-[18px] py-[14px]">
          <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--scan)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
              <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
          </div>
          <div>
            <div className="text-[17px] font-extrabold tracking-tight">Logística QR</div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Control de inventario</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2.5">
          {navSections.map((section) => (
            <div key={section.section}>
              <div className="px-2.5 pb-1.5 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">
                {section.section}
              </div>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} active={location.pathname === item.href} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] px-3.5 py-3.5">
          <button
            onClick={() => { auth.logout(); navigate({ to: '/login' }); }}
            className="flex w-full items-center gap-2.5 rounded-lg bg-[var(--surface-2)] px-2.5 py-2 text-left transition-colors hover:bg-[var(--surface-3)]"
          >
            <div className={`flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[12px] font-bold text-white ${
              isOwner
                ? 'from-[var(--accent)] to-[var(--scan)]'
                : 'from-[var(--scan)] to-[var(--green)]'
            }`}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{auth.user?.name}</div>
              <div className="text-[11px] text-[var(--text-muted)]">{ROLE_LABEL[auth.user?.role ?? ''] ?? auth.user?.role}</div>
            </div>
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 flex-shrink-0 items-center gap-2.5 border-b border-[var(--border)] px-5 sm:hidden">
          <button
            onClick={() => {}}
            className="flex items-center justify-center rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            aria-label="Abrir menú"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-[var(--accent)] to-[var(--scan)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
                <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-[var(--text)]">Logística QR</span>
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-auto p-5 pb-20 sm:pb-5">
          <Outlet />
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[62px] border-t border-[var(--border)] bg-[var(--surface)] sm:hidden">
        <div className="flex w-full">
          {bottomNavItems.map((item) => {
            if ('scanner' in item && item.scanner) {
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-[var(--text-muted)]"
                >
                  <div className="relative top-[-12px]">
                    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--scan)] text-white shadow-lg">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="7" y1="12" x2="17" y2="12"/>
                      </svg>
                    </div>
                  </div>
                  Escanear
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                  location.pathname === item.href ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                }`}
              >
                <span className="flex-shrink-0 relative">
                  {item.icon}
                  {item.badge && (
                    <span className="absolute -right-2 -top-1.5 rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: ProtectedLayout,
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

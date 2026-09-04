import { Link } from '@tanstack/react-router';
import { LayoutGrid, Calendar, Package, ScanLine, Menu } from 'lucide-react';

interface BottomNavProps {
  isOwner: boolean;
  onMoreClick: () => void;
}

const itemClass =
  'flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] text-muted-foreground [&.active]:text-primary';

export function BottomNav({ isOwner, onMoreClick }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-card px-2 py-2 lg:hidden">
      <Link to="/" className={itemClass}>
        <LayoutGrid className="h-5 w-5" />
        Tablero
      </Link>
      <Link to="/events" className={itemClass}>
        <Calendar className="h-5 w-5" />
        Eventos
      </Link>
      <Link
        to="/scanner"
        aria-label="Escanear"
        className="-mt-7 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-scan text-white shadow-lg shadow-primary/30"
      >
        <ScanLine className="h-6 w-6" />
      </Link>
      {isOwner ? (
        <Link to="/equipment" className={itemClass}>
          <Package className="h-5 w-5" />
          Equipos
        </Link>
      ) : (
        <span className="w-10" />
      )}
      <button type="button" onClick={onMoreClick} className={itemClass}>
        <Menu className="h-5 w-5" />
        Más
      </button>
    </nav>
  );
}

import { cn } from '@/lib/utils';
import type { StatusTone } from '../lib/status-presentation';

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  destructive: 'bg-destructive/15 text-destructive',
  repair: 'bg-repair/15 text-repair',
  neutral: 'bg-muted text-muted-foreground',
};

const DOT_CLASSES: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  repair: 'bg-repair',
  neutral: 'bg-muted-foreground',
};

export const STATUS_BAR_CLASSES: Record<StatusTone, string> = DOT_CLASSES;

interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
  dot?: boolean;
  pill?: boolean;
  className?: string;
}

export function StatusBadge({ tone, label, dot = false, pill = true, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        pill ? 'rounded-full' : 'rounded-md',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_CLASSES[tone])} />}
      {label}
    </span>
  );
}

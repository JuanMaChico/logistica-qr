import type { ReactNode } from 'react';
import { Card, CardContent } from './ui/card';
import { StatusBadge, STATUS_BAR_CLASSES } from './status-badge';
import { getEquipmentStatus, getConditionStatus } from '../lib/status-presentation';
import { cn } from '@/lib/utils';
import type { Equipment } from '@logistica/types';

interface EquipmentCardProps {
  equipment: Equipment;
  categoryLabel: string;
  actions?: ReactNode;
  className?: string;
}

export function EquipmentCard({ equipment, categoryLabel, actions, className }: EquipmentCardProps) {
  const status = getEquipmentStatus(equipment);
  const condition = getConditionStatus(equipment.physicalStatus);

  return (
    <Card className={cn('overflow-hidden p-0', className)}>
      <div className={cn('h-1', STATUS_BAR_CLASSES[status.tone])} />
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">{equipment.name}</h3>
            <p className="font-mono text-xs text-muted-foreground">{equipment.qrCode}</p>
          </div>
          <StatusBadge tone={status.tone} label={status.label} dot />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{categoryLabel}</span>
          {condition && <StatusBadge tone={condition.tone} label={condition.label} pill={false} />}
        </div>
        {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
      </CardContent>
    </Card>
  );
}

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconClassName?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconClassName,
}: MetricCardProps) {
  return (
    <div className="card-elevated p-2.5 md:p-6 animate-slide-up">
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] md:text-sm font-medium text-muted-foreground truncate leading-tight">{title}</p>
          <p className="mt-0.5 md:mt-2 text-lg md:text-3xl font-display font-semibold text-foreground">{value}</p>
          {change && (
            <p
              className={cn(
                'mt-0.5 md:mt-2 text-[10px] md:text-sm font-medium truncate',
                changeType === 'positive' && 'text-success',
                changeType === 'negative' && 'text-destructive',
                changeType === 'neutral' && 'text-muted-foreground'
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div
          className={cn(
            'p-1.5 md:p-3 rounded-md md:rounded-xl flex-shrink-0',
            iconClassName || 'bg-accent/10'
          )}
        >
          <Icon className={cn('w-3.5 h-3.5 md:w-6 md:h-6', iconClassName ? 'text-white' : 'text-accent')} />
        </div>
      </div>
    </div>
  );
}

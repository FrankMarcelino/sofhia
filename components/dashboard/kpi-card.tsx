import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: 'success' | 'info' | 'warning' | 'primary';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const iconGradients = {
  success: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
  info: 'bg-gradient-to-br from-blue-400 to-blue-600',
  warning: 'bg-gradient-to-br from-amber-400 to-amber-600',
  primary: 'bg-gradient-to-br from-[#005c2d] to-[#004221]',
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'primary',
  trend,
  className,
}: KPICardProps) {
  return (
    <Card className={cn('shadow-sm hover:shadow-md transition-shadow duration-200', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          iconGradients[iconColor]
        )}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-3xl font-bold text-foreground">{value}</div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1.5 mt-3">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <span
              className={cn(
                'text-sm font-semibold',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">vs. mês passado</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Wifi, Key, User, Server, Bot, Activity } from 'lucide-react';

type HealthStatus = 'online' | 'offline' | 'checking' | 'valid' | 'invalid' | 'active' | 'inactive';
type IconName = 'wifi' | 'key' | 'user' | 'server' | 'bot' | 'activity';

const iconMap = {
  wifi: Wifi,
  key: Key,
  user: User,
  server: Server,
  bot: Bot,
  activity: Activity,
};

interface HealthCardProps {
  title: string;
  status: HealthStatus;
  description?: string;
  icon: IconName;
  className?: string;
}

const statusConfig: Record<HealthStatus, { label: string; color: string; bgColor: string; pulse: boolean }> = {
  online: {
    label: 'Online',
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-500/10',
    pulse: true
  },
  offline: {
    label: 'Offline',
    color: 'bg-red-500',
    bgColor: 'bg-red-500/10',
    pulse: false
  },
  checking: {
    label: 'Verificando...',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-500/10',
    pulse: true
  },
  valid: {
    label: 'Válido',
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-500/10',
    pulse: false
  },
  invalid: {
    label: 'Inválido',
    color: 'bg-red-500',
    bgColor: 'bg-red-500/10',
    pulse: false
  },
  active: {
    label: 'Ativo',
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-500/10',
    pulse: false
  },
  inactive: {
    label: 'Inativo',
    color: 'bg-gray-400',
    bgColor: 'bg-gray-400/10',
    pulse: false
  },
};

export function HealthCard({ title, status, description, icon, className }: HealthCardProps) {
  const config = statusConfig[status];
  const Icon = iconMap[icon];

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Icon Container */}
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl',
              config.bgColor
            )}>
              <Icon className={cn(
                'h-6 w-6',
                status === 'online' || status === 'valid' || status === 'active'
                  ? 'text-emerald-600'
                  : status === 'offline' || status === 'invalid'
                    ? 'text-red-600'
                    : status === 'checking'
                      ? 'text-amber-600'
                      : 'text-gray-500'
              )} />
            </div>

            {/* Content */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-lg font-bold text-foreground">{config.label}</p>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={cn(
              'h-3 w-3 rounded-full',
              config.color,
              config.pulse && 'animate-pulse'
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

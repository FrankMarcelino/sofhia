'use client';

import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Clock, UserCheck, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  stats: {
    ativas: number;
    hoje: number;
    aguardandoHumano: number;
    encerradasHoje: number;
  };
  className?: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

function StatCard({ icon, label, value, color, bgColor }: StatCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            bgColor
          )}>
            <div className={color}>
              {icon}
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards({ stats, className }: StatsCardsProps) {
  return (
    <div className={cn('grid grid-cols-4 gap-4', className)}>
      <StatCard
        icon={<MessageSquare className="h-6 w-6" />}
        label="Conversas Ativas"
        value={stats.ativas}
        color="text-emerald-600"
        bgColor="bg-emerald-100"
      />
      <StatCard
        icon={<Clock className="h-6 w-6" />}
        label="Iniciadas Hoje"
        value={stats.hoje}
        color="text-blue-600"
        bgColor="bg-blue-100"
      />
      <StatCard
        icon={<UserCheck className="h-6 w-6" />}
        label="Aguardando Humano"
        value={stats.aguardandoHumano}
        color="text-amber-600"
        bgColor="bg-amber-100"
      />
      <StatCard
        icon={<CheckCircle className="h-6 w-6" />}
        label="Encerradas Hoje"
        value={stats.encerradasHoje}
        color="text-slate-600"
        bgColor="bg-slate-100"
      />
    </div>
  );
}

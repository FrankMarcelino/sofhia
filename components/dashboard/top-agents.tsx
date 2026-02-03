import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface TopAgent {
  id: string;
  nome: string;
  taxaConversao: number;
  totalConversas: number;
  avatar?: string;
  cor?: string;
}

interface TopAgentsProps {
  agents: TopAgent[];
  className?: string;
}

const AVATAR_COLORS = [
  'bg-gradient-to-br from-emerald-400 to-emerald-600',
  'bg-gradient-to-br from-blue-400 to-blue-600',
  'bg-gradient-to-br from-purple-400 to-purple-600',
  'bg-gradient-to-br from-pink-400 to-pink-600',
  'bg-gradient-to-br from-amber-400 to-amber-600',
];

export function TopAgents({ agents, className }: TopAgentsProps) {
  if (agents.length === 0) {
    return (
      <Card className={cn('shadow-sm', className)}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">Top Performing Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum agente ativo ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">Top Performing Agents</CardTitle>
        <Link 
          href="/neurocore/editor" 
          className="text-sm font-medium text-primary hover:underline"
        >
          Manage Agents
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.slice(0, 6).map((agent, index) => (
            <div
              key={agent.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:shadow-sm transition-all duration-200 cursor-pointer"
            >
              {/* Avatar */}
              <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                <AvatarFallback className={cn(
                  'text-white font-semibold',
                  agent.cor || AVATAR_COLORS[index % AVATAR_COLORS.length]
                )}>
                  <Bot className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate mb-0.5">
                  {agent.nome}
                </p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs font-semibold',
                    agent.taxaConversao >= 50 ? 'text-success' :
                    agent.taxaConversao >= 30 ? 'text-info' :
                    'text-warning'
                  )}>
                    {agent.taxaConversao}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {agent.totalConversas} conversas
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

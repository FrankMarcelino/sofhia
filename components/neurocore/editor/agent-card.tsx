'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';
import type { Agente } from '@/types/agents';

interface AgentCardProps {
  agente: Agente;
  isSelected: boolean;
  onClick: () => void;
}

export function AgentCard({ agente, isSelected, onClick }: AgentCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md min-w-[200px] max-w-[250px]',
        isSelected
          ? 'ring-2 ring-primary border-primary bg-primary/5'
          : 'hover:border-primary/50'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'p-2 rounded-lg shrink-0',
              isSelected ? 'bg-primary/20' : 'bg-muted'
            )}
          >
            <Bot
              className={cn(
                'h-5 w-5',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm truncate">
              {agente.nome_agente}
            </h3>
            {agente.nome_agente_identificador && (
              <p className="text-xs text-muted-foreground truncate">
                {agente.nome_agente_identificador}
              </p>
            )}
            <div className="mt-2">
              <Badge
                variant={agente.ativo ? 'success' : 'secondary'}
                className="text-xs"
              >
                {agente.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

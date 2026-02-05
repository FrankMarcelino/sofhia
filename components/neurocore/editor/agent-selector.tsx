'use client';

import { useState } from 'react';
import { AgentCard } from './agent-card';
import { AgentEditTabs } from './agent-edit-tabs';
import type { Agente, ModeloIA } from '@/types/agents';
import type { Extracao } from '@/lib/queries/neurocore';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface AgentSelectorProps {
  agentes: Agente[];
  modelos: ModeloIA[];
  extracoesByAgente: Record<string, Extracao[]>;
}

export function AgentSelector({
  agentes,
  modelos,
  extracoesByAgente,
}: AgentSelectorProps) {
  const [selectedAgenteId, setSelectedAgenteId] = useState<string | null>(
    agentes.length > 0 ? agentes[0].id_agente : null
  );

  const selectedAgente = agentes.find((a) => a.id_agente === selectedAgenteId);
  const selectedExtracoes = selectedAgenteId
    ? extracoesByAgente[selectedAgenteId] || []
    : [];

  return (
    <div className="space-y-6">
      {/* Lista horizontal de agentes */}
      <div className="w-full">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {agentes.map((agente) => (
              <AgentCard
                key={agente.id_agente}
                agente={agente}
                isSelected={agente.id_agente === selectedAgenteId}
                onClick={() => setSelectedAgenteId(agente.id_agente)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Editor do agente selecionado */}
      {selectedAgente && (
        <AgentEditTabs
          key={selectedAgente.id_agente}
          agente={selectedAgente}
          modelos={modelos}
          extracoes={selectedExtracoes}
        />
      )}
    </div>
  );
}

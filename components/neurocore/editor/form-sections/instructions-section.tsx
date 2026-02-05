'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { AgentFormData } from '@/types/agents';
import { GuidelineListSection } from './guideline-list-section';

interface InstructionsSectionProps {
  form: UseFormReturn<AgentFormData>;
}

export function InstructionsSection({ form }: InstructionsSectionProps) {
  return (
    <GuidelineListSection
      form={form}
      fieldName="instrucoes"
      title="Instruções"
      description="Defina o que o agente DEVE fazer. Arraste para reordenar por prioridade."
      addButtonText="Adicionar Instrução"
      emptyText="Nenhuma instrução configurada."
    />
  );
}

'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { AgentFormData } from '@/types/agents';
import { GuidelineListSection } from './guideline-list-section';

interface LimitationsSectionProps {
  form: UseFormReturn<AgentFormData>;
}

export function LimitationsSection({ form }: LimitationsSectionProps) {
  return (
    <GuidelineListSection
      form={form}
      fieldName="limitacoes"
      title="Limitações"
      description="Defina o que o agente NÃO deve fazer. Arraste para reordenar."
      addButtonText="Adicionar Limitação"
      emptyText="Nenhuma limitação configurada."
    />
  );
}

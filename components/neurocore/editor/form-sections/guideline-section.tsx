'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { AgentFormData } from '@/types/agents';
import { GuidelineListSection } from './guideline-list-section';

interface GuidelineSectionProps {
  form: UseFormReturn<AgentFormData>;
}

export function GuidelineSection({ form }: GuidelineSectionProps) {
  return (
    <GuidelineListSection
      form={form}
      fieldName="roteiro"
      title="Guideline / Roteiro"
      description="Defina o fluxo de atendimento e etapas a seguir. Arraste para reordenar."
      addButtonText="Adicionar Etapa"
      emptyText="Nenhuma etapa do roteiro configurada."
    />
  );
}

'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { AgentFormData } from '@/types/agents';
import { GuidelineListSection } from './guideline-list-section';

interface RulesSectionProps {
  form: UseFormReturn<AgentFormData>;
}

export function RulesSection({ form }: RulesSectionProps) {
  return (
    <GuidelineListSection
      form={form}
      fieldName="rules"
      title="Regras"
      description="Defina regras de negócio e comportamento. Arraste para reordenar."
      addButtonText="Adicionar Regra"
      emptyText="Nenhuma regra configurada."
    />
  );
}

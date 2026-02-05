'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { AgentFormData } from '@/types/agents';
import { GuidelineListSection } from './guideline-list-section';

interface OthersInstructionsSectionProps {
  form: UseFormReturn<AgentFormData>;
}

export function OthersInstructionsSection({ form }: OthersInstructionsSectionProps) {
  return (
    <GuidelineListSection
      form={form}
      fieldName="others_instructions"
      title="Outras Instruções"
      description="Instruções adicionais e observações. Arraste para reordenar."
      addButtonText="Adicionar Instrução"
      emptyText="Nenhuma instrução adicional configurada."
    />
  );
}

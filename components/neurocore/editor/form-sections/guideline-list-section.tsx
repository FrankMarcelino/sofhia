'use client';

import { useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { AgentFormData, GuidelineStep } from '@/types/agents';
import { SortableGuidelineStep } from '../sortable/sortable-guideline-step';

interface GuidelineListSectionProps {
  form: UseFormReturn<AgentFormData>;
  fieldName: keyof Pick<AgentFormData, 'limitacoes' | 'instrucoes' | 'roteiro' | 'rules' | 'others_instructions'>;
  title: string;
  description: string;
  addButtonText: string;
  emptyText: string;
}

export function GuidelineListSection({
  form,
  fieldName,
  title,
  description,
  addButtonText,
  emptyText,
}: GuidelineListSectionProps) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: fieldName,
  });

  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
      }
    }
  }

  function addStep() {
    const newStep: GuidelineStep = {
      title: '',
      type: 'markdown',
      active: true,
      sub: [],
    };
    append(newStep);

    // Auto-expand the new step
    setTimeout(() => {
      const newFields = form.getValues(fieldName);
      if (newFields && newFields.length > 0) {
        const lastField = fields[fields.length];
        if (lastField) {
          setExpandedSteps((prev) => new Set([...prev, lastField.id]));
        }
      }
    }, 50);
  }

  function toggleExpanded(fieldId: string) {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {fields.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                <p className="text-sm text-muted-foreground">{emptyText}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Clique em &quot;{addButtonText}&quot; para começar.
                </p>
              </div>
            )}

            {fields.map((field, index) => (
              <SortableGuidelineStep
                key={field.id}
                id={field.id}
                index={index}
                fieldName={fieldName}
                form={form}
                onRemove={() => remove(index)}
                isExpanded={expandedSteps.has(field.id)}
                onToggleExpanded={() => toggleExpanded(field.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        onClick={addStep}
        variant="outline"
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        {addButtonText}
      </Button>
    </div>
  );
}

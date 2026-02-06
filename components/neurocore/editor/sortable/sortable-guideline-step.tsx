'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UseFormReturn } from 'react-hook-form';
import type { AgentFormData, GuidelineStep } from '@/types/agents';

interface SortableGuidelineStepProps {
  id: string;
  index: number;
  fieldName: keyof Pick<AgentFormData, 'limitacoes' | 'instrucoes' | 'roteiro' | 'rules' | 'others_instructions'>;
  form: UseFormReturn<AgentFormData>;
  onRemove: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export function SortableGuidelineStep({
  id,
  index,
  fieldName,
  form,
  onRemove,
  isExpanded,
  onToggleExpanded,
}: SortableGuidelineStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fieldPath = `${fieldName}.${index}` as const;
  const step = form.watch(fieldPath) as GuidelineStep | undefined;

  const handleTitleChange = (value: string) => {
    form.setValue(`${fieldName}.${index}.title` as keyof AgentFormData, value as never);
  };

  const handleActiveChange = (checked: boolean) => {
    form.setValue(`${fieldName}.${index}.active` as keyof AgentFormData, checked as never);
  };

  const handleAddSubInstruction = () => {
    const currentSub = step?.sub || [];
    form.setValue(`${fieldName}.${index}.sub` as keyof AgentFormData, [
      ...currentSub,
      { content: '', active: true },
    ] as never);
  };

  const handleSubContentChange = (subIndex: number, value: string) => {
    const currentSub = [...(step?.sub || [])];
    currentSub[subIndex] = { ...currentSub[subIndex], content: value };
    form.setValue(`${fieldName}.${index}.sub` as keyof AgentFormData, currentSub as never);
  };

  const handleSubActiveChange = (subIndex: number, checked: boolean) => {
    const currentSub = [...(step?.sub || [])];
    currentSub[subIndex] = { ...currentSub[subIndex], active: checked };
    form.setValue(`${fieldName}.${index}.sub` as keyof AgentFormData, currentSub as never);
  };

  const handleRemoveSub = (subIndex: number) => {
    const currentSub = [...(step?.sub || [])];
    currentSub.splice(subIndex, 1);
    form.setValue(`${fieldName}.${index}.sub` as keyof AgentFormData, currentSub as never);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'border-0 rounded-xl bg-card shadow-sm transition-all',
        isDragging && 'opacity-50 shadow-md',
        !step?.active && 'opacity-60'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggleExpanded}
          className="text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <span className="text-sm font-medium text-muted-foreground w-8">
          #{index + 1}
        </span>

        <Input
          value={step?.title || ''}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Título do item..."
          className="flex-1 h-8"
        />

        <div className="flex items-center gap-2">
          <Switch
            checked={step?.active ?? true}
            onCheckedChange={handleActiveChange}
          />
          <button
            type="button"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content (expanded) */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Sub-instruções */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Sub-instruções ({step?.sub?.length || 0})
            </Label>

            {step?.sub?.map((subItem, subIndex) => (
              <AutoResizeSubItem
                key={subIndex}
                index={index}
                subIndex={subIndex}
                content={subItem.content}
                active={subItem.active}
                onContentChange={(value) => handleSubContentChange(subIndex, value)}
                onActiveChange={(checked) => handleSubActiveChange(subIndex, checked)}
                onRemove={() => handleRemoveSub(subIndex)}
              />
            ))}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddSubInstruction}
              className="ml-4 h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar detalhe
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AutoResizeSubItem({
  index,
  subIndex,
  content,
  active,
  onContentChange,
  onActiveChange,
  onRemove,
}: {
  index: number;
  subIndex: number;
  content: string;
  active: boolean;
  onContentChange: (value: string) => void;
  onActiveChange: (checked: boolean) => void;
  onRemove: () => void;
}) {
  const adjustHeight = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const setRef = useCallback((el: HTMLTextAreaElement | null) => {
    adjustHeight(el);
  }, [adjustHeight]);

  return (
    <div className="flex items-start gap-2 pl-4">
      <span className="text-xs text-muted-foreground w-6 pt-2">
        {index + 1}.{subIndex + 1}
      </span>
      <textarea
        ref={setRef}
        value={content}
        onChange={(e) => {
          onContentChange(e.target.value);
          adjustHeight(e.target);
        }}
        onFocus={(e) => adjustHeight(e.target)}
        placeholder="Detalhe adicional..."
        rows={1}
        className="flex-1 min-h-[32px] px-3 py-1.5 text-sm border border-input rounded-md bg-background resize-none overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <Switch
        checked={active}
        onCheckedChange={onActiveChange}
        className="mt-1"
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive transition-colors mt-1.5"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

import { GripVertical, Plus, Trash2 } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  EMBED_FIELDS_MAX,
  EMBED_FIELD_NAME_MAX,
  EMBED_FIELD_VALUE_MAX,
  type EmbedFieldInput,
} from "@adobos/shared";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface EmbedFieldsBuilderProps {
  fields: EmbedFieldInput[];
  onChange: (fields: EmbedFieldInput[]) => void;
  disabled?: boolean;
}

function emptyField(): EmbedFieldInput {
  return { name: "", value: "", inline: false };
}

function fieldItemId(index: number): string {
  return `embed-field-${index}`;
}

function SortableEmbedField({
  field,
  index,
  disabled,
  onRemove,
  onUpdate,
}: {
  field: EmbedFieldInput;
  index: number;
  disabled?: boolean;
  onRemove: () => void;
  onUpdate: (patch: Partial<EmbedFieldInput>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: fieldItemId(index),
    disabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "space-y-2 rounded-md border border-border bg-muted/30 p-3",
        isDragging && "opacity-80 shadow-[var(--shadow-2)] ring-1 ring-primary/40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "shrink-0 text-muted-foreground",
              disabled
                ? "cursor-not-allowed"
                : "cursor-grab active:cursor-grabbing",
            )}
            {...(disabled ? {} : { ...attributes, ...listeners })}
          >
            <GripVertical className="size-3.5" aria-hidden />
          </span>
          <p className="text-xs font-medium text-muted-foreground">
            Field {index + 1}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onRemove}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      </div>
      <Input
        value={field.name}
        maxLength={EMBED_FIELD_NAME_MAX}
        placeholder="Name"
        disabled={disabled}
        onChange={(event) => onUpdate({ name: event.target.value })}
      />
      <Textarea
        value={field.value}
        maxLength={EMBED_FIELD_VALUE_MAX}
        rows={2}
        placeholder="Value"
        disabled={disabled}
        onChange={(event) => onUpdate({ value: event.target.value })}
      />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={Boolean(field.inline)}
          disabled={disabled}
          onCheckedChange={(checked) => onUpdate({ inline: checked === true })}
        />
        Inline
      </label>
    </div>
  );
}

export function EmbedFieldsBuilder({
  fields,
  onChange,
  disabled,
}: EmbedFieldsBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function addField(): void {
    if (fields.length >= EMBED_FIELDS_MAX) return;
    onChange([...fields, emptyField()]);
  }

  function removeField(index: number): void {
    onChange(fields.filter((_, i) => i !== index));
  }

  function updateField(
    index: number,
    patch: Partial<EmbedFieldInput>,
  ): void {
    onChange(
      fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    );
  }

  function onDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (!over || disabled || active.id === over.id) return;
    const from = fields.findIndex((_, i) => fieldItemId(i) === String(active.id));
    const to = fields.findIndex((_, i) => fieldItemId(i) === String(over.id));
    if (from < 0 || to < 0) return;
    onChange(arrayMove(fields, from, to));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Fields</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || fields.length >= EMBED_FIELDS_MAX}
          onClick={addField}
        >
          <Plus className="size-3.5" aria-hidden />
          Field
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Up to {EMBED_FIELDS_MAX}. Name 256, value 1024. Inline groups by 3
        like Discord.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={fields.map((_, index) => fieldItemId(index))}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {fields.map((field, index) => (
              <SortableEmbedField
                key={fieldItemId(index)}
                field={field}
                index={index}
                disabled={disabled}
                onRemove={() => removeField(index)}
                onUpdate={(patch) => updateField(index, patch)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

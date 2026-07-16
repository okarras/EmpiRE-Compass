import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Box, TextField, Typography } from '@mui/material';
import { SortableBlockItem } from './SortableBlockItem';

export interface FormBlock {
  id: string;
  title: string;
  type: 'text' | 'textarea' | 'select' | 'section';
  value: string;
}

interface SortableBlockListProps {
  items: FormBlock[];
  onItemsChange: (items: FormBlock[]) => void;
  onValuesChange: (id: string, value: string) => void;
}

export function SortableBlockList({
  items,
  onItemsChange,
  onValuesChange,
}: SortableBlockListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      onItemsChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleChange = (id: string, newValue: string) => {
    onValuesChange(id, newValue);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <Box sx={{ width: '100%' }}>
          {items.map((block) => (
            <SortableBlockItem key={block.id} id={block.id} title={block.title}>
              <TextField
                fullWidth
                multiline={block.type === 'textarea'}
                rows={block.type === 'textarea' ? 3 : 1}
                variant="outlined"
                value={block.value}
                onChange={(e) => handleChange(block.id, e.target.value)}
                placeholder={`Enter ${block.title.toLowerCase()}...`}
                size="small"
              />
            </SortableBlockItem>
          ))}
        </Box>
      </SortableContext>
    </DndContext>
  );
}

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Paper, Box, IconButton, Typography } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { ReactNode } from 'react';

interface SortableBlockItemProps {
  id: string;
  title?: string;
  children: ReactNode;
}

export function SortableBlockItem({
  id,
  title,
  children,
}: SortableBlockItemProps) {
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
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 2,
        p: 2,
        display: 'flex',
        alignItems: 'flex-start',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: isDragging ? 3 : 1,
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          cursor: 'grab',
          mr: 2,
          mt: 0.5,
          color: 'text.secondary',
          display: 'flex',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <DragIndicatorIcon />
      </Box>

      <Box flex={1} sx={{ minWidth: 0 }}>
        {title && (
          <Typography
            variant="h6"
            sx={{ mb: 1.5, fontSize: '1.1rem', fontWeight: 600 }}
          >
            {title}
          </Typography>
        )}
        {children}
      </Box>
    </Paper>
  );
}

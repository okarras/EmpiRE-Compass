import { Box, Typography } from '@mui/material';
import { SortableBlockList, FormBlock } from './SortableBlockList';
import { useDraftStorage } from '../../hooks/useDraftStorage';

interface QuestionnaireFormProps {
  answers: Record<string, string>;
  setAnswers: (answers: Record<string, string>) => void;
}

const DEFAULT_BLOCKS: FormBlock[] = [
  { id: '1', title: 'Research Goal', type: 'text', value: '' },
  { id: '2', title: 'Methodology', type: 'textarea', value: '' },
  { id: '3', title: 'Expected Outcomes', type: 'textarea', value: '' },
];

export function QuestionnaireForm({
  answers,
  setAnswers,
}: QuestionnaireFormProps) {
  const [blocks, setBlocks] = useDraftStorage<FormBlock[]>(
    'scidquest-blocks-structure',
    DEFAULT_BLOCKS
  );

  const handleValuesChange = (id: string, value: string) => {
    const updatedBlocks = blocks.map((b) =>
      b.id === id ? { ...b, value } : b
    );
    setBlocks(updatedBlocks);

    const newAnswers = updatedBlocks.reduce(
      (acc, b) => {
        acc[b.id] = b.value;
        return acc;
      },
      {} as Record<string, string>
    );

    setAnswers(newAnswers);
  };

  const handleItemsChange = (newBlocks: FormBlock[]) => {
    setBlocks(newBlocks);
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Dynamic Questionnaire
      </Typography>
      <SortableBlockList
        items={blocks}
        onItemsChange={handleItemsChange}
        onValuesChange={handleValuesChange}
      />
    </Box>
  );
}

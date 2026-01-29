import React, { useState } from 'react';
import { Box, Typography, Alert, Divider } from '@mui/material';
import EditableSection from './EditableSection';
import type { Query } from '../constants/queries_chart_info';

interface QuestionInformationViewProps {
  query: Query;
  isInteractive?: boolean;
  tabIndex?: number;
  isEditingInfo?: boolean; // New prop for admin edit mode
  onSave?: (field: string, content: string | string[]) => Promise<void>; // New prop for saving
}

const QuestionInformationView: React.FC<QuestionInformationViewProps> = ({
  query,
  isInteractive = false,
  tabIndex = 0,
  isEditingInfo = false,
  onSave,
}) => {
  const [error, setError] = useState<string | null>(null);

  const info = query.dataAnalysisInformation;

  const getSectionContent = (
    section: 'question' | 'dataCollection' | 'dataAnalysis'
  ) => {
    // If we are in "static" mode but have overridden query, the "info" object is already updated in parent

    // Fallback to static info if interactive mode is off (which it is for this task)
    // DynamicAIQuestion uses its own logic in parent mostly, but let's stick to reading from `info`

    switch (section) {
      case 'question':
        return info.questionExplanation || '';
      case 'dataCollection':
        if (Array.isArray(info.requiredDataForAnalysis)) {
          return info.requiredDataForAnalysis[tabIndex] || '';
        }
        return info.requiredDataForAnalysis || '';
      case 'dataAnalysis':
        if (Array.isArray(info.dataAnalysis)) {
          return info.dataAnalysis[tabIndex] || '';
        }
        return info.dataAnalysis || '';
      default:
        return '';
    }
  };

  const handleSave = async (section: string, newContent: string) => {
    if (!onSave) return;

    try {
      if (section === 'question') {
        await onSave('dataAnalysisInformation.questionExplanation', newContent);
      } else if (section === 'dataCollection') {
        // If it's an array we need to preserve the other index
        // This logic is tricky if we don't know if it SHOULD be an array or not.
        // For now, let's assume if it WAS an array, we keep it as array.
        const current = info.requiredDataForAnalysis;
        if (Array.isArray(current)) {
          const newArray = [...current];
          newArray[tabIndex] = newContent;
          await onSave(
            'dataAnalysisInformation.requiredDataForAnalysis',
            newArray
          );
        } else {
          await onSave(
            'dataAnalysisInformation.requiredDataForAnalysis',
            newContent
          );
        }
      } else if (section === 'dataAnalysis') {
        const current = info.dataAnalysis;
        if (Array.isArray(current)) {
          const newArray = [...current];
          newArray[tabIndex] = newContent;
          await onSave('dataAnalysisInformation.dataAnalysis', newArray);
        } else {
          await onSave('dataAnalysisInformation.dataAnalysis', newContent);
        }
      }
    } catch (err) {
      setError('Failed to save changes');
      console.error(err);
    }
  };

  const renderSection = (
    title: string,
    content: string,
    section: 'question' | 'dataCollection' | 'dataAnalysis'
  ) => {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: '#e86161', mb: 1 }}
        >
          {title}
        </Typography>

        <EditableSection
          isEditingInfo={isEditingInfo}
          content={content}
          sectionLabel={title}
          onSave={(newVal) => handleSave(section, newVal)}
          isHtml={true}
        />
      </Box>
    );
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {renderSection(
        'Explanation of the Competency Question',
        getSectionContent('question') as string,
        'question'
      )}
      <Divider sx={{ my: 2 }} />
      {renderSection(
        'Required Data for Analysis',
        getSectionContent('dataCollection') as string,
        'dataCollection'
      )}
      <Divider sx={{ my: 2 }} />
      {renderSection(
        'Data Analysis',
        getSectionContent('dataAnalysis') as string,
        'dataAnalysis'
      )}
    </Box>
  );
};

export default QuestionInformationView;

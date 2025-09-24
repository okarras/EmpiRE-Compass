import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import {
  HistoryManager,
  useHistoryManager,
  HistoryItem,
} from './HistoryManager';

const HistoryManagerDemo: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<HistoryItem['type'] | null>(
    null
  );
  const { addToHistory } = useHistoryManager();

  // Sample data for demonstration
  const sampleHistoryItems = [
    {
      type: 'query' as const,
      content: 'What are the most cited papers in machine learning?',
      title: 'ML Citation Query',
    },
    {
      type: 'sparql' as const,
      content:
        'SELECT ?paper ?citations WHERE { ?paper rdf:type :Paper . ?paper :citations ?citations } ORDER BY DESC(?citations)',
      title: 'Top Papers SPARQL Query',
    },
    {
      type: 'chart_description' as const,
      content: 'Bar chart showing citation counts for top 10 ML papers',
      title: 'Citation Chart Description',
    },
    {
      type: 'data_interpretation' as const,
      content:
        'The data shows a clear trend of increasing citations for deep learning papers over the past 5 years.',
      title: 'Deep Learning Citation Analysis',
    },
  ];

  const addSampleData = () => {
    sampleHistoryItems.forEach((item, index) => {
      setTimeout(() => {
        addToHistory(item.type, item.content, item.title);
      }, index * 100);
    });
  };

  const handleApplyItem = (item: HistoryItem) => {
    console.log('Applied history item:', item);
    // In a real application, this would apply the item to the current context
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Enhanced History Manager Demo
      </Typography>

      <Typography variant="body1" paragraph>
        This demo showcases the enhanced History Manager with:
      </Typography>

      <ul>
        <li>
          <strong>Section Categorization:</strong> History items are
          automatically grouped by section (Query & Analysis, Data
          Visualization, SPARQL & Database, Content Interpretation)
        </li>
        <li>
          <strong>Search Functionality:</strong> Search through history by
          title, content, type, or section
        </li>
        <li>
          <strong>History Preferences:</strong> Customizable settings stored in
          localStorage including compact view, auto-save, and section grouping
        </li>
        <li>
          <strong>Complete Deletion:</strong> Delete all history or by specific
          sections/types
        </li>
        <li>
          <strong>Enhanced UI:</strong> Improved visual design with accordions,
          badges, and better organization
        </li>
      </ul>

      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={addSampleData}
          sx={{ backgroundColor: '#e86161' }}
        >
          Add Sample History Items
        </Button>

        <Button
          variant="outlined"
          onClick={() => {
            setSelectedType(null);
            setDialogOpen(true);
          }}
        >
          Open Full History Manager
        </Button>

        <Button
          variant="outlined"
          onClick={() => {
            setSelectedType('sparql');
            setDialogOpen(true);
          }}
        >
          Open SPARQL History Only
        </Button>
      </Box>

      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
        Key Features:
      </Typography>

      <Box component="ul" sx={{ pl: 2 }}>
        <li>
          🔍 <strong>Advanced Search:</strong> Find items by any text content
        </li>
        <li>
          📁 <strong>Smart Categorization:</strong> Automatic section grouping
          based on item type
        </li>
        <li>
          ⚙️ <strong>Customizable Preferences:</strong> Toggle features like
          compact view and search
        </li>
        <li>
          🗑️ <strong>Flexible Deletion:</strong> Remove all items, by section,
          or by type
        </li>
        <li>
          📊 <strong>Usage Statistics:</strong> See item counts and manage
          storage
        </li>
        <li>
          ✏️ <strong>Inline Editing:</strong> Edit history items directly in the
          dialog
        </li>
      </Box>

      <HistoryManager
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        type={selectedType}
        onApplyHistoryItem={handleApplyItem}
      />
    </Box>
  );
};

export default HistoryManagerDemo;

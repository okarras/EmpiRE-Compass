import React from 'react';
import { Box } from '@mui/material';
import TemplateGraph from '../components/Graph/TemplateGraph';
import data from '../templates/empirical_research_practice.json';

const TemplateGraphPage = () => {
  return (
    <Box sx={{ flex: 1, height: 'calc(100vh - 64px)' }}>
      <TemplateGraph data={data as any} />
    </Box>
  );
};

export default TemplateGraphPage;

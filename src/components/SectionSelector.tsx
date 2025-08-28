import React from 'react';
import { Box, Button, Tooltip, Chip, Paper, Typography } from '@mui/material';
import {
  Psychology as AIIcon,
  BarChart as ChartIcon,
  TableView as DataIcon,
  Info as InfoIcon,
  TrendingUp as TrendIcon,
  Assessment as AnalysisIcon,
} from '@mui/icons-material';
import { useAIAssistantContext } from '../context/AIAssistantContext';
import type { Query } from '../constants/queries_chart_info';

interface SectionSelectorProps {
  sectionType: 'information' | 'chart' | 'data';
  sectionTitle: string;
  query?: Query;
  data?: Record<string, unknown>[];
}

const SectionSelector: React.FC<SectionSelectorProps> = ({
  sectionType,
  sectionTitle,
}) => {
  const { sendStructuredPrompt } = useAIAssistantContext();

  const getStructuredPrompts = () => {
    const basePrompts = {
      information: [
        {
          label: 'Explain Research Question',
          icon: <InfoIcon />,
          prompt: `Please provide a detailed explanation of this research question. Include:
          - The significance and relevance of this research question in Requirements Engineering
          - The methodology and approach used for this analysis
          - How this question contributes to the broader field of empirical research
          - Key concepts and definitions that are important for understanding this research`,
        },
        {
          label: 'Analyze Required Data',
          icon: <AnalysisIcon />,
          prompt: `Please analyze the required data for this research question. Include:
          - What specific data is needed to answer this research question
          - How the data collection approach supports the research objectives
          - The quality and completeness of the available data
          - Any limitations or considerations regarding the data requirements`,
        },
        {
          label: 'Interpret Analysis Method',
          icon: <TrendIcon />,
          prompt: `Please explain the data analysis method used for this research question. Include:
          - The rationale behind choosing this specific analysis method
          - How this method helps answer the research question
          - The steps involved in the analysis process
          - How the results should be interpreted and what they tell us`,
        },
      ],
      chart: [
        {
          label: 'Explain Chart Insights',
          icon: <ChartIcon />,
          prompt: `Please provide a comprehensive analysis of the chart visualization for this research question. Include:
          - Key patterns, trends, and insights visible in the chart
          - What the visualization reveals about the research question
          - Statistical significance of the displayed data
          - How the chart supports or challenges existing hypotheses
          - Recommendations based on the visual analysis`,
        },
        {
          label: 'Compare Data Points',
          icon: <AnalysisIcon />,
          prompt: `Please analyze and compare the different data points shown in this visualization. Include:
          - Comparison between different categories or time periods
          - Identification of outliers or notable patterns
          - Relationships between different variables
          - Statistical significance of observed differences
          - Implications of these comparisons for the research question`,
        },
        {
          label: 'Generate Alternative Views',
          icon: <TrendIcon />,
          prompt: `Please suggest alternative ways to visualize and analyze this data. Include:
          - Different chart types that could provide additional insights
          - Alternative grouping or categorization approaches
          - Statistical analysis methods that could complement the visualization
          - What additional questions could be explored with this data
          - How different perspectives might change our understanding`,
        },
      ],
      data: [
        {
          label: 'Summarize Key Findings',
          icon: <DataIcon />,
          prompt: `Please provide a comprehensive summary of the key findings from this dataset. Include:
          - The most significant patterns and trends in the data
          - Statistical summaries and distributions
          - Notable outliers or exceptional cases
          - How these findings relate to the research question
          - Confidence levels and data quality considerations`,
        },
        {
          label: 'Identify Data Patterns',
          icon: <TrendIcon />,
          prompt: `Please identify and analyze patterns in this dataset. Include:
          - Recurring themes or patterns across the data
          - Correlations between different variables
          - Temporal or categorical trends
          - Unexpected or counterintuitive findings
          - How these patterns inform our understanding of the research domain`,
        },
        {
          label: 'Data Quality Assessment',
          icon: <AnalysisIcon />,
          prompt: `Please assess the quality and completeness of this dataset. Include:
          - Coverage and representativeness of the data
          - Missing data or gaps in the dataset
          - Data consistency and reliability
          - Potential biases or limitations
          - Recommendations for data improvement or additional collection`,
        },
      ],
    };

    return basePrompts[sectionType] || [];
  };

  const prompts = getStructuredPrompts();

  const handlePromptClick = (prompt: string) => {
    sendStructuredPrompt(prompt);
  };

  const getSectionIcon = () => {
    switch (sectionType) {
      case 'information':
        return <InfoIcon />;
      case 'chart':
        return <ChartIcon />;
      case 'data':
        return <DataIcon />;
      default:
        return <AIIcon />;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        backgroundColor: 'rgba(232, 97, 97, 0.02)',
        border: '1px solid rgba(232, 97, 97, 0.1)',
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {getSectionIcon()}
        <Typography
          variant="subtitle2"
          sx={{ color: '#e86161', fontWeight: 600 }}
        >
          AI Analysis Options for {sectionTitle}
        </Typography>
        <Chip
          label="AI"
          size="small"
          sx={{
            backgroundColor: '#e86161',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click any button below to get detailed AI analysis of this section:
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        {prompts.map((promptConfig, index) => (
          <Tooltip key={index} title={`Get AI analysis: ${promptConfig.label}`}>
            <Button
              size="small"
              variant="outlined"
              startIcon={promptConfig.icon}
              onClick={() => handlePromptClick(promptConfig.prompt)}
              sx={{
                borderColor: '#e86161',
                color: '#e86161',
                '&:hover': {
                  borderColor: '#d45151',
                  backgroundColor: 'rgba(232, 97, 97, 0.08)',
                },
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              {promptConfig.label}
            </Button>
          </Tooltip>
        ))}
      </Box>
    </Paper>
  );
};

export default SectionSelector;

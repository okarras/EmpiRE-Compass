import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect } from 'react';
import Question from '../../src/components/Question';
import { Query } from '../../src/constants/queries_chart_info';

// Mock query object
const mockQuery: Query = {
  uid: 'Q1',
  uid_2: 'Q1_2',
  id: 1,
  chartType: 'bar',
  chartSettings: {
    heading: 'Number of empirical studies per year',
    series: [{ label: 'empirical', dataKey: 'value' }],
    colors: ['#e86161'],
    yAxis: [{ label: 'Proportion', dataKey: 'value' }],
  },
  chartSettings2: {
    heading: 'Analysis Results',
    series: [{ label: 'analyzed', dataKey: 'value' }],
    colors: ['#61e8aa'],
    yAxis: [{ label: 'Proportion', dataKey: 'value' }],
  },
  dataProcessingFunction: (data) => data,
  dataProcessingFunction2: (data) => data,
  dataAnalysisInformation: {
    question: 'How has the proportion of empirical studies evolved over time?',
    questionExplanation:
      '<p>This shows trends in empirical study reporting in scientific papers.</p>',
    requiredDataForAnalysis:
      '<p>We need year and study classification data to perform this analysis.</p>',
    dataAnalysis:
      '<p>A bar chart is used to show the proportion of papers reporting empirical studies per year.</p>',
    dataInterpretation:
      '<p>A rising trend reflects increasing methodological rigor in research.</p>',
  },
};

// Component metadata for Storybook
const meta: Meta<typeof Question> = {
  title: 'Components/Question',
  component: Question,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The `Question` component is a fully integrated UI block that fetches and displays SPARQL-based chart and table visualizations. It supports two modes: data collection and data analysis, with tabbed navigation and normalization toggles. Designed for dashboard integration.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Question>;

//  Mock SPARQL response override (used in dev/Storybook)
const overrideFetchSPARQL = () => {
  import('../../src/helpers/fetch_query').then((mod) => {
    mod.default = async (_query) => {
      return [
        { year: 1993, value: 20 },
        { year: 1995, value: 35 },
        { year: 1998, value: 60 },
        { year: 2005, value: 80 },
        { year: 2010, value: 65 },
        { year: 2015, value: 90 },
        { year: 2020, value: 100 },
      ];
    };
  });
};

//  Default story with mock behavior
export const Default: Story = {
  render: () => {
    useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        overrideFetchSPARQL();
      }
    }, []);

    return <Question query={mockQuery} />;
  },
  parameters: {
    docs: {
      description: {
        story:
          'This example shows the complete `Question` component using mock data. The chart displays the number of empirical studies per year, and the tabs allow switching to a second dataset if defined.',
      },
    },
  },
};

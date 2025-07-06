import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import QuestionChartView from '../../src/components/QuestionChartView';
import { Query } from '../constants/queries_chart_info';
// this is not working need to work more
const meta: Meta<typeof QuestionChartView> = {
  title: 'Components/QuestionChartView',
  component: QuestionChartView,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof QuestionChartView>;

const mockQuery: Query = {
  uid: 'query_1',
  chartType: 'bar',
  chartSettings: {
    heading: 'Number of papers without an empirical study per year',
    series: [
      {
        label: 'papers without an empirical study',
        dataKey: 'value',
      },
    ],
    colors: ['#e86161'],
    yAxis: [
      {
        label: 'Proportion of papers without an empirical study',
        dataKey: 'value',
      },
    ],
  },
  dataProcessingFunction: (data) => data,
};

const mockData = [
  { year: 1993, value: 70.59 },
  { year: 1994, value: 64.71 },
  { year: 1995, value: 47.06 },
  { year: 1996, value: 100 },
  { year: 1997, value: 58.82 },
  { year: 1998, value: 58.82 },
  { year: 1999, value: 23.53 },
  { year: 2000, value: 17.65 },
  { year: 2001, value: 47.06 },
  { year: 2002, value: 70.59 },
  { year: 2003, value: 41.18 },
  { year: 2004, value: 47.06 },
  { year: 2005, value: 23.53 },
  { year: 2006, value: 41.18 },
  { year: 2007, value: 29.41 },
  { year: 2008, value: 29.41 },
  { year: 2009, value: 47.06 },
  { year: 2010, value: 52.94 },
  { year: 2011, value: 17.65 },
  { year: 2012, value: 17.65 },
  { year: 2013, value: 11.76 },
  { year: 2014, value: 11.76 },
  { year: 2016, value: 17.65 },
  { year: 2018, value: 23.53 },
  { year: 2020, value: 17.65 },
  { year: 2022, value: 5.88 },
];

export const Default: Story = {
  render: () => {
    const [normalized, setNormalized] = useState(true);

    return (
      <QuestionChartView
        query={mockQuery}
        questionData={mockData}
        normalized={normalized}
        setNormalized={setNormalized}
        queryId="Q1"
      />
    );
  },
};

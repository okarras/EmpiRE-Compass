import { Box } from '@mui/material';
import CustomBarChart from './CustomBarChart';
import CustomPieChart from './CustomPieChart';
import CustomHeatMap from './CustomHeatMap';
import { ChartSetting } from '../../constants/queries_chart_info';
import CustomBoxPlot from './CustomBoxPlot';
import CustomScatterChart from './CustomScatterChart';

interface ChartWrapperProps {
  dataset: any[];
  chartSetting: ChartSetting;
  question_id: string;
  normalized?: boolean;
  loading: boolean;
  defaultChartType?: 'bar' | 'pie' | 'heatmap' | 'boxplot' | 'scatter';
  availableCharts?: ('bar' | 'pie' | 'heatmap' | 'boxplot' | 'scatter')[];
  isSubChart?: boolean;
}

const ChartWrapper = ({
  dataset,
  chartSetting,
  question_id,
  normalized = true,
  loading = false,
  defaultChartType = 'bar',
  isSubChart = false,
}: ChartWrapperProps) => {
  return (
    <Box sx={{ width: '100%' }}>
      {defaultChartType === 'pie' ? (
        <CustomPieChart
          dataset={dataset}
          chartSetting={chartSetting}
          question_id={question_id}
        />
      ) : defaultChartType === 'heatmap' ? (
        <CustomHeatMap
          dataset={dataset}
          chartSetting={chartSetting}
          question_id={question_id}
        />
      ) : defaultChartType === 'boxplot' ? (
        <CustomBoxPlot
          dataset={dataset}
          chartSetting={chartSetting}
          question_id={question_id}
          loading={loading}
        />
      ) : defaultChartType === 'scatter' ? (
        <CustomScatterChart
          dataset={dataset}
          chartSetting={chartSetting}
          question_id={question_id}
          normalized={normalized}
          loading={loading}
        />
      ) : (
        <CustomBarChart
          dataset={dataset}
          chartSetting={chartSetting}
          question_id={question_id}
          normalized={normalized}
          loading={loading}
          isSubChart={isSubChart}
        />
      )}
    </Box>
  );
};

export default ChartWrapper;

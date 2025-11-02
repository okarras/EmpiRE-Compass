import { Box } from '@mui/material';
import CustomBarChart from './CustomBarChart';
import { ChartSetting } from '../../constants/queries_chart_info';

interface ChartWrapperProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataset: any[];
  chartSetting: ChartSetting;
  question_id: string;
  normalized?: boolean;
  loading: boolean;
  defaultChartType?: 'bar' | 'pie';
  availableCharts?: ('bar' | 'pie')[];
  isSubChart?: boolean;
}

// interface DataItem {
//   year?: number;
//   method?: string;
//   methodType?: string;
//   count?: number;
//   normalizedRatio?: number;
//   [key: string]: unknown;
// }

// interface PieDataItem {
//   [key: string]: string | number;
//   id: string;
//   label: string;
//   value: number;
// }

const ChartWrapper = ({
  dataset,
  chartSetting,
  question_id,
  normalized = true,
  loading = false,
  // defaultChartType = 'bar',
  // availableCharts = ['bar', 'pie'],
  isSubChart = false,
}: ChartWrapperProps) => {
  // const [chartType, setChartType] = useState<'bar' | 'pie'>(defaultChartType);

  // const transformDataForPieChart = (
  //   data: DataItem[],
  //   chartSetting: ChartSetting
  // ): PieDataItem[] => {
  //   if (!data || data.length === 0) return [];

  //   if (chartSetting.series.length > 1) {
  //     const pieDataItems = chartSetting.series.map(
  //       (item: { dataKey: string; label: string }) => ({
  //         value: 0,
  //         label: item.label,
  //         id: item.dataKey,
  //       })
  //     );

  //     pieDataItems.forEach(
  //       (item: { value: number; label: string; id: string }) => {
  //         data.forEach((dataItem) => {
  //           // if the dataItem key is the same as the item id, add the value to the item
  //           if (dataItem[item.id]) {
  //             item.value += dataItem[item.id] as number;
  //           }
  //         });
  //       }
  //     );

  //     return pieDataItems;
  //   }

  //   const xAxisDataKey = chartSetting.xAxis[0].dataKey;
  //   const seriesDataKey = chartSetting.series[0].dataKey;

  //   const pieDataItems = data.map((item, index) => ({
  //     value: normalized
  //       ? (item.normalizedRatio ?? Number(item[seriesDataKey] ?? 0))
  //       : (item.count ?? Number(item[seriesDataKey] ?? 0)),
  //     label: String(item[xAxisDataKey] ?? ''),
  //     id: String(index),
  //   }));
  //   return pieDataItems;
  // };

  return (
    <Box sx={{ width: '100%' }}>
      {/* <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <ChartTypeSelector
          chartType={chartType}
          setChartType={setChartType}
          availableCharts={availableCharts}
        />
      </Box> */}

      <CustomBarChart
        dataset={dataset}
        chartSetting={chartSetting}
        question_id={question_id}
        normalized={normalized}
        loading={loading}
        isSubChart={isSubChart}
      />
    </Box>
  );
};

export default ChartWrapper;

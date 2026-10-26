import { Chart, registerables } from 'chart.js';
import {
  BoxPlotController,
  BoxAndWiskers,
} from '@sgratzl/chartjs-chart-boxplot';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';

Chart.register(
  ...registerables,
  BoxPlotController,
  BoxAndWiskers,
  MatrixController,
  MatrixElement
);

// Required for dynamically compiled LLM scripts
if (typeof window !== 'undefined') {
  (window as any).Chart = Chart;
}

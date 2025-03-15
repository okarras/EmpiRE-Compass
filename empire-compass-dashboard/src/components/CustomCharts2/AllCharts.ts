import Questions1 from "../DataProcessFunctions/Questions1";
import Questions2 from "../DataProcessFunctions/Questions2";
import Questions3 from "../DataProcessFunctions/Questions3";
import Questions4 from "../DataProcessFunctions/Questions4";
import Questions5 from "../DataProcessFunctions/Questions5";

export default function AllCharts() {
  return [
    {
      "id": 1,
      "question": 'How has the proportion of empirical studies evolved over time?',
      "ChartComponent": Questions1
    },
    {
      "id": 2,
      "question": 'How often are which empirical methods used over time?',
      "ChartComponent": Questions2
    },
    {
      "id": 3,
      "question": 'How has the proportion of papers that do not have an empirical study evolved over time?',
      "ChartComponent": Questions3
    },
    {
      "id": 4,
      "question": 'How often are which empirical methods used?',
      "ChartComponent": Questions4
    },
    {
      "id": 5,
      "question": 'How have the proportions of experiments, secondary research (reviews), surveys, case studies, and action research in the empirical methods used evolved over time?',
      "ChartComponent": Questions5
    }
  ]
} 
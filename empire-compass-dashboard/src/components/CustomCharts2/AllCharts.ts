import Questions1 from "../DataProcessFunctions/Questions1";
import Questions10 from "../DataProcessFunctions/Questions10";
import Questions11 from "../DataProcessFunctions/Questions11";
import Questions13 from "../DataProcessFunctions/Questions13";
import Questions2 from "../DataProcessFunctions/Questions2";
import Questions3 from "../DataProcessFunctions/Questions3";
import Questions4 from "../DataProcessFunctions/Questions4";
import Questions5 from "../DataProcessFunctions/Questions5";
import Questions6 from "../DataProcessFunctions/Questions6";
import Questions7 from "../DataProcessFunctions/Questions7";
import Questions8 from "../DataProcessFunctions/Questions8";
import Questions9 from "../DataProcessFunctions/Questions9";

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
    },
    {
      "id": "6.1",
      "question": "How often are which statistical methods used?",
      "ChartComponent": Questions6
    },
    {
      "id": "7.1",
      "question": "How has the use of statistical methods evolved over time?",
      "ChartComponent": Questions7
    },
    {
      "id": "8",
      "question": "How has the reporting of threats to validity evolved over time?",
      "ChartComponent": Questions8
    },
    {
      "id": "9",
      "question": "What types of threats to validity do the authors report?",
      "ChartComponent": Questions9
    },
    {
      "id": "10",
      "question": "How have the proportions of case studies and action research in the empirical methods used evolved over time?",
      "ChartComponent": Questions10
    },
    {
      "id": "11",
      "question": "How has the provision of data (the materials used, raw data collected, and study results identified) evolved over time?",
      "ChartComponent": Questions11
    },
    {
      "id": "13",
      "question": "How has the provision of data (the materials used, raw data collected, and study results identified) evolved over time?",
      "ChartComponent": Questions13
    }
  ]
} 
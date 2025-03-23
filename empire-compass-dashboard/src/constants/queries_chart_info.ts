import { axisClasses } from '@mui/x-charts';
// import questions2Data from '../../data/query_2.1_data_2024-07-26.json'
// import questions3Data from '../../data/query_3_data_2025-02-27.json'

export const queries = [
  // Query 1
   {
    title: 'Number of papers per year',
    id: 1,
    uid: 'query_1',
    chartSetting: {
      yAxis: [
        {
          label: 'number of papers',
        },
      ],
      series: [{ dataKey: 'count' }],
      height: 300,
      sx: {
        [`& .${axisClasses.directionY} .${axisClasses.label}`]: {
          transform: 'translateX(-10px)',
        },
      },
    },
    dataProcessingFunction: (data: { year: number }[]) => {
      //sort the data by year
      data.sort((a: { year: number }, b: { year: number }) => a.year - b.year);
      // get the unique years from the data
      const years = [
        ...new Set(data.map((item: { year: unknown }) => item.year)),
      ];
      // get number of items for each year
      const itemsPerYear = years.map((year) => {
        return {
          count: data.filter((item: { year: unknown }) => item.year === year)
            .length,
          year: year,
        };
      });
      return itemsPerYear;
    },
    dataAnalysisInformation:{
      question: 'How has the proportion of empirical studies evolved over time?'
    }
  },
  {
    title: 'Number of papers per year',
    id: 2_1,
    uid: 'query_2_1',
    chartSetting: {
      yAxis: [
        {
          label: 'Number of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'case study', label: 'case study' },
        { dataKey: 'experiment', label: 'Experiment' },
        { dataKey: 'survey', label: 'Survey' },
        { dataKey: 'interview', label: 'Interview' },
        { dataKey: 'secondary research', label: 'Secondary research' },
        { dataKey: 'action research', label: 'action research' },
        { dataKey: 'others', label: 'Other' }
      ],
      height: 300,
      sx: {
        [`& .${axisClasses.directionY} .${axisClasses.label}`]: {
          transform: 'translateX(-10px)',
        },
      },
    },
    dataProcessingFunction: (SampleData) => {
      //sort the data by year
      let years = [...new Set(SampleData.map((item: { year: unknown }) => item.year))];
      years = years.map((value)=>{
        return {"year": value}
      })

      let processedData = years.map((value, index)=>{

        let filteredData = SampleData.filter((dataValue)=>{
          return dataValue.year == value.year
        })
        let result = {"year":value.year, "total": 0};

        filteredData.forEach((value: {dc_method_type_label: string}, index)=>{
          if (value.dc_method_type_label == "action research" || value.dc_method_type_label == "case study" || value.dc_method_type_label == "experiment"|| value.dc_method_type_label == "interview" || value.dc_method_type_label == "secondary research" || value.dc_method_type_label == "survey" || value.dc_method_type_label == "secondary research" ) {
            if (result.hasOwnProperty(value.dc_method_type_label)) {
              result[value.dc_method_type_label] = result[value.dc_method_type_label] + 1;
            } else{
              result[value.dc_method_type_label] = 1;
            }
          } else {
            if (result.hasOwnProperty("others")) {
              result.others = result.others + 1;
            } else {
              result.others = 1
            }
          }

          result.total = result.total + 1;
        })

        Object.entries(result).forEach((value, index)=>{
          if (value[0] != "year" && value[0] != "total" ) {
            result[value[0] + " ratio"] = Number((value[1]/result.total).toFixed(2));
          }
        })
        return result;
      })
      processedData.sort((a,b)=>{ return a.year - b.year });

      return processedData;
    },
    dataAnalysisInformation:{
      question: 'How often are which empirical methods used over time?'
    }
  },
  {
    title: 'Number of papers per year',
    id: 3,
    uid: 'query_3',
    chartSetting: {
      yAxis: [
        {
          label: 'Number of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'count', label: 'Case study' },
      ],
      height: 300,
      sx: {
        [`& .${axisClasses.directionY} .${axisClasses.label}`]: {
          transform: 'translateX(-10px)',
        },
      },
    },
    dataProcessingFunction: (SampleData) => {

      const dataYears = [
        ...new Set(SampleData.map((item: { year: number }) => item.year)),
      ];

      const itemsPerYear = dataYears.map((year) => {
        return {
          count: SampleData.filter((item: { year: number, dc_label: string, da_label: string }) => item.year === year && item.dc_label == 'collection' && item.da_label == 'analysis' ).length,
          ratio: Number(((SampleData.filter((item: { year: number, dc_label: string, da_label: string }) => item.year === year ).length - SampleData.filter((item: { year: number, dc_label: string, da_label: string }) => item.year === year && item.dc_label == 'collection' && item.da_label == 'analysis' ).length ) / SampleData.filter((item: { year: number, dc_label: string, da_label: string }) => item.year === year ).length).toFixed(2)),
          year: year,
        };
      });

      itemsPerYear.sort((a,b)=>{ return a.year - b.year });

      return itemsPerYear;
    },
    dataAnalysisInformation:{
      question: 'How has the proportion of papers that do not have an empirical study evolved over time?'
    }
  },
];

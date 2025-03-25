import { axisClasses } from '@mui/x-charts';
import questions2Data from '../../data/query_2.1_data_2024-07-26.json'
import questions3Data from '../../data/query_3_data_2025-02-27.json' 
import questions5Data from '../../data/query_5_data_2025-02-27.json'
import questions6Data from '../../data/query_6.1_data_2024-07-26.json'
import questions7Data from '../../data/query_7.1_data_2025-02-27.json'
import questions8Data from '../../data/query_8_data_2025-02-27.json'
import questions9Data from '../../data/query_9_data_2025-02-27.json'
import questions10Data from '../../data/query_10_data_2025-02-27.json'
import questions11Data from '../../data/query_11_data_2025-02-27.json'
import questions12Data from '../../data/query_12_data_2025-02-27.json'
import questions13Data from '../../data/query_13_data_2025-02-27.json'
import questions14Data from '../../data/query_14_data_2025-02-27.json'
import questions15Data from '../../data/query_15.1_data_2025-02-27.json'
import questions15_2Data from '../../data/query_15.1_data_2025-02-27.json'



let chartStyles = {
  [`& .${axisClasses.directionY} .${axisClasses.label}`]: {
    transform: 'translateX(-10px)',
  },
}

let chartHeight = 400;

function xAxisSettings(dataKey = 'year', label: 'Year'){
  return [{
    scaleType: 'band',
    dataKey: dataKey,
    valueFormatter: (v) => v.toString(),
    tickPlacement: 'middle',
    label: label
  }]
} 

export const queries = [
  // Query 1
   {
    title: 'Number of papers per year',
    id: 1,
    uid: 'query_1',
    chartSetting: [{
      yAxis: [
        {
          label: 'number of papers',
        },
      ],
      series: [{ dataKey: 'count' }],
      height: chartHeight,
      sx: chartStyles,
      className: 'fullWidth'
    }],
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
    chartSetting: [{
      className: 'fullWidth',
      xAxis: xAxisSettings(),
      colors: ['#4c72b0', '#dd8452', '#55a868', '#c44e52', '#8172b3', '#937860', '#da8bc3'],
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
      height: chartHeight,
      sx: chartStyles,
    },
    {
      xAxis: xAxisSettings(),
      colors: ['#4c72b0'],
      barLabel: "value",
      yAxis: [
        {
          label: 'Number of case studies',
        },
      ],
      series: [
        { dataKey: 'case study'}
      ],
      height: chartHeight,
      sx: chartStyles,
    }, 
    {
      xAxis: xAxisSettings(),
      colors: ['#dd8452'],
      barLabel: "value",
      yAxis: [
        {
          label: 'Number of experiments',
        },
      ],
      series: [
        { dataKey: 'experiment'}
      ],
      height: chartHeight,
      sx: chartStyles,
    }, 
    {
      xAxis: xAxisSettings(),
      colors: ['#5f9e6e'],
      barLabel: "value",
      yAxis: [
        {
          label: 'Number of survey',
        },
      ],
      series: [
        { dataKey: 'survey'}
      ],
      height: chartHeight,
      sx: chartStyles,
    }, 
    {
      xAxis: xAxisSettings(),
      colors: ['#b55d60'],
      barLabel: "value",
      yAxis: [
        {
          label: 'Number of interview',
        },
      ],
      series: [
        { dataKey: 'interview'}
      ],
      height: chartHeight,
      sx: chartStyles,
    }, 
    {
      xAxis: xAxisSettings(),
      colors: ['#857aab'],
      barLabel: "value",
      yAxis: [
        {
          label: 'Number of secondary research',
        },
      ],
      series: [
        { dataKey: 'secondary research'}
      ],
      height: chartHeight,
      sx: chartStyles,
    }, 
    {
      xAxis: xAxisSettings(),
      colors: ['#8d7866'],
      barLabel: "value",
      yAxis: [
        {
          label: 'Number of action research',
        },
      ],
      series: [
        { dataKey: 'action research'}
      ],
      height: chartHeight,
      sx: chartStyles,
    }, 
    {
      xAxis: xAxisSettings(),
      colors: ['#d095bf'],
      barLabel: "value",
      yAxis: [
        {
          label: 'Number of others',
        },
      ],
      series: [
        { dataKey: 'others'}
      ],
      height: chartHeight,
      sx: chartStyles,
    }, 
    {
      className: "fullWidth",
      xAxis: xAxisSettings(),
      colors: ['#4c72b0', '#dd8452', '#55a868', '#c44e52', '#8172b3', '#937860', '#da8bc3'],
      yAxis: [
        {
          label: 'Proportion of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'case study ratio', label: 'case study' },
        { dataKey: 'experiment ratio', label: 'Experiment' },
        { dataKey: 'survey ratio', label: 'Survey' },
        { dataKey: 'interview ratio', label: 'Interview' },
        { dataKey: 'secondary research ratio', label: 'Secondary research' },
        { dataKey: 'action research ratio', label: 'action research' },
        { dataKey: 'others ratio', label: 'Other' }
      ],
      height: chartHeight,
      sx: chartStyles,
    }, 
    {
      xAxis: xAxisSettings(),
      colors: ['#4c72b0'],
      barLabel: "value",
      yAxis: [
        {
          label: 'Proportion of case studies',
        },
      ],
      series: [
        { dataKey: 'case study ratio' },
      ],
      height: chartHeight,
      sx: chartStyles,
    }, 
    {
      xAxis: xAxisSettings(),
      colors: ['#dd8452'],
      barLabel: "value",
      yAxis: [
        {
          label: 'Proportion of experiments',
        },
      ],
      series: [
        { dataKey: 'experiment ratio' },
      ],
      height: chartHeight,
      sx: chartStyles,
    }, 
    {
      xAxis: xAxisSettings(),
      colors: ['#5f9e6e'],
      barLabel: "value",
      yAxis: [
        {
          label: 'Proportion of survey',
        },
      ],
      series: [
        { dataKey: 'survey ratio' },
      ],
      height: chartHeight,
      sx: chartStyles,
    }, 
    {
      xAxis: xAxisSettings(),
      colors: ['#b55d60'],
      barLabel: "value",
      yAxis: [
        {
          label: 'Proportion of interview',
        },
      ],
      series: [
        { dataKey: 'interview ratio' },
      ],
      height: chartHeight,
      sx: chartStyles,
    }, 
    {
      xAxis: xAxisSettings(),
      colors: ['#857aab'],
      barLabel: "value",
      yAxis: [
        {
          label: 'Proportion of secondary research',
        },
      ],
      series: [
        { dataKey: 'secondary research ratio' },
      ],
      height: chartHeight,
      sx: chartStyles,
    }, 
    {
      xAxis: xAxisSettings(),
      colors: ['#8d7866'],
      barLabel: "value",
      yAxis: [
        {
          label: 'Proportion of action research',
        },
      ],
      series: [
        { dataKey: 'action research ratio' },
      ],
      height: chartHeight,
      sx: chartStyles,
    }, 
    {
      xAxis: xAxisSettings(),
      colors: ['#d095bf'],
      barLabel: "value",
      yAxis: [
        {
          label: 'Proportion of others',
        },
      ],
      series: [
        { dataKey: 'others ratio' },
      ],
      height: chartHeight,
      sx: chartStyles,
    }],
    dataProcessingFunction: (SampleData = questions2Data) => {
      //sort the data by year
      let years;
      if (SampleData != undefined) {
        years = [...new Set(SampleData.map((item: { year: unknown }) => item.year))];
      
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
     }
    },
    dataAnalysisInformation:{
      question: 'How often are which empirical methods used over time?'
    }
  },
  {
    title: 'Number of papers per year',
    id: 3,
    uid: 'query_3',
    chartSetting: [{
      className: 'fullWidth',
      colors: ['#5975a4'],
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Number of papers without an empirical study',
        },
      ],
      series: [
        { dataKey: 'count' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      className: 'fullWidth',
      colors: ['#5975a4'],
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportion of papers without an empirical study',
        },
      ],
      series: [
        { dataKey: 'ratio' },
      ],
      height: chartHeight,
      sx: chartStyles,
    }],
    dataProcessingFunction: (SampleData = questions3Data) => {

      if (SampleData != undefined) {

      const dataYears = [
        ...new Set(SampleData.map((item: { year: number }) => item.year)),
      ];
    
      const itemsPerYear = dataYears.map((year) => {
        return {
          count: SampleData.filter((item: { year: number, dc_label: string, da_label: string }) => {
            if (item.year === year ) {
              if ( item.dc_label == 'no collection' || item.da_label == 'no analysis') {
                return item
              }
            }
          } ).length,
          ratio: Number(((SampleData.filter((item: { year: number, dc_label: string, da_label: string }) => item.year === year ).length - SampleData.filter((item: { year: number, dc_label: string, da_label: string }) => item.year === year && item.dc_label == 'collection' && item.da_label == 'analysis' ).length ) / SampleData.filter((item: { year: number, dc_label: string, da_label: string }) => item.year === year ).length).toFixed(2)),
          year: year,
        };
      }); 
  
      itemsPerYear.sort((a,b)=>{ return a.year - b.year });

      return itemsPerYear;
    }
    },
    dataAnalysisInformation:{
      question: 'How has the proportion of papers that do not have an empirical study evolved over time?'
    }
  },
  {
    title: 'Number of papers per year',
    id: 5,
    uid: 'query_5',
    chartSetting: [{
      className: 'fullWidth',
      colors: ['#5975a4', '#cc8963', '#5f9e6e', '#c44e52', '#8d7866'],
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportion of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'experiment ratio', label: 'Experiment' },
        { dataKey: 'case study ratio', label: 'case study' },
        { dataKey: 'secondary research ratio', label: 'Secondary research' },
        { dataKey: 'survey ratio', label: 'Survey' },
        { dataKey: 'action research ratio', label: 'action research' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportion of experiments',
        },
      ],
      series: [
        { dataKey: 'experiment ratio' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#cc8963'],
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportion of case studies',
        },
      ],
      series: [
        { dataKey: 'case study ratio'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5f9e6e'],
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportion of secondary research',
        },
      ],
      series: [
        { dataKey: 'secondary research ratio'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#857aab'],
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportion of survey',
        },
      ],
      series: [
        { dataKey: 'survey ratio'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#8d7866'],
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportion of action research',
        },
      ],
      series: [
        { dataKey: 'action research ratio'},
      ],
      height: chartHeight,
      sx: chartStyles,
    }],
    dataProcessingFunction: (SampleData = questions5Data) => {

      if (SampleData != undefined) {

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
            if (value.dc_method_type_label == "action research" || value.dc_method_type_label == "case study" || value.dc_method_type_label == "experiment" || value.dc_method_type_label == "survey" || value.dc_method_type_label == "secondary research" ) {
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
      }
    },
    dataAnalysisInformation:{
      question: 'How have the proportions of experiments, secondary research (reviews), surveys, case studies, and action research in the empirical methods used evolved over time?'
    }
  },
  {
    title: 'Number of papers per year',
    id: 6.1,
    uid: 'query_6_1',
    chartSetting: [{
      layout: "horizontal",
      className: 'fullWidth',
      colors: ['#5975a4', '#cc8963', '#5f9e6e', '#c44e52', '#8d7866'],
      barLabel: "value",
      yAxis: [
        { scaleType: 'band', dataKey: 'method' }
      ],
      series: [
        { dataKey: 'count' }
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      layout: "horizontal",
      className: 'fullWidth',
      colors: ['#5975a4', '#cc8963', '#5f9e6e', '#c44e52', '#8d7866'],
      barLabel: "value",
      yAxis: [
        { scaleType: 'band', dataKey: 'method' }
      ],
      series: [
        { dataKey: 'ratio' }
      ],
      height: chartHeight,
      sx: chartStyles,
    }],
    dataProcessingFunction: (SampleData = questions6Data) => {

      if (SampleData != undefined) {
        let processedData = {};
        let result = [];
        SampleData.forEach((dataValue, index)=>{ 
                 
          Object.keys(dataValue).forEach((value, index)=>{
            if (dataValue[value] > 0) {
              if (processedData.hasOwnProperty(value)) {
                processedData[value] = processedData[value] + 1;
              } else {
                processedData[value] = 1;
              }
            }
          })
    
        })
    
        Object.entries(processedData).forEach((value, index)=>{
          result.push({
            "method": value[0],
            "count": value[1],
            "ratio": Number((value[1] / SampleData.length).toFixed(2))
          })
        })
    
        result.sort((a, b)=>{ return b.count - a.count });
        return result;
      }
    },
    dataAnalysisInformation:{
      question: 'How often are which statistical methods used?'
    }
  },
  {
    title: 'Number of papers per year',
    id: 7.1,
    uid: 'query_7_1',
    chartSetting: [{
      className: 'fullWidth',
      colors: ['#5975a4', '#cc8963', '#5f9e6e', '#c44e52', '#8172b3', '#937860', '#da8bc3', '#8c8c8c', '#ccb974', '#64b5cd', '#4c72b0'],
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Number of statistical methods used',
        },
      ],
      series: [
        { dataKey: 'count', label: 'count' },
        { dataKey: 'percent', label: 'percent' },
        { dataKey: 'mean', label: 'mean' },
        { dataKey: 'median', label: 'median' },
        { dataKey: 'mode', label: 'mode' },
        { dataKey: 'minimum', label: 'minimum' },
        { dataKey: 'maximum', label: 'maximum' },
        { dataKey: 'range', label: 'range' },
        { dataKey: 'variance', label: 'variance' },
        { dataKey: 'standard_deviation', label: 'standard_deviation' },
        { dataKey: 'boxplot', label: 'boxplot' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Number of count methods',
        },
      ],
      series: [
        { dataKey: 'count' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#cc8963'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Number of precent method',
        },
      ],
      series: [
        { dataKey: 'percent'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5f9e6e'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Number of mean method',
        },
      ],
      series: [
        { dataKey: 'mean' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#c44e52'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Number of median method',
        },
      ],
      series: [
        { dataKey: 'median' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#8172b3'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Number of mode method',
        },
      ],
      series: [
        { dataKey: 'mode' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#937860'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Number of minimum method',
        },
      ],
      series: [
        { dataKey: 'minimum' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#da8bc3'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Number of maximum method',
        },
      ],
      series: [
        { dataKey: 'maximum' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#8c8c8c'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Number of range method',
        },
      ],
      series: [
        { dataKey: 'range' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#ccb974'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Number of variance method',
        },
      ],
      series: [
        { dataKey: 'variance' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#64b5cd'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Number of standard_deviation method',
        },
      ],
      series: [
        { dataKey: 'standard_deviation' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#4c72b0'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Number of boxplot method',
        },
      ],
      series: [
        { dataKey: 'boxplot' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      className: 'fullWidth',
      colors: ['#5975a4', '#cc8963', '#5f9e6e', '#c44e52', '#8172b3', '#937860', '#da8bc3', '#8c8c8c', '#ccb974', '#64b5cd', '#4c72b0'],
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportion of statistical methods used',
        },
      ],
      series: [
        { dataKey: 'count_normalized', label: 'count' },
        { dataKey: 'percent_normalized', label: 'percent' },
        { dataKey: 'mean_normalized', label: 'mean' },
        { dataKey: 'median_normalized', label: 'median' },
        { dataKey: 'mode_normalized', label: 'mode' },
        { dataKey: 'minimum_normalized', label: 'minimum' },
        { dataKey: 'maximum_normalized', label: 'maximum' },
        { dataKey: 'range_normalized', label: 'range' },
        { dataKey: 'variance_normalized', label: 'variance' },
        { dataKey: 'standard_deviation_normalized', label: 'standard_deviation' },
        { dataKey: 'boxplot_normalized', label: 'boxplot' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Proportion of count methods',
        },
      ],
      series: [
        { dataKey: 'count_normalized' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#cc8963'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Proportion of precent method',
        },
      ],
      series: [
        { dataKey: 'percent_normalized'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5f9e6e'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Proportion of mean method',
        },
      ],
      series: [
        { dataKey: 'mean_normalized' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#c44e52'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Proportion of median method',
        },
      ],
      series: [
        { dataKey: 'median_normalized' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#8172b3'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Proportion of mode method',
        },
      ],
      series: [
        { dataKey: 'mode_normalized' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#937860'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Proportion of minimum method',
        },
      ],
      series: [
        { dataKey: 'minimum_normalized' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#da8bc3'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Proportion of maximum method',
        },
      ],
      series: [
        { dataKey: 'maximum_normalized' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#8c8c8c'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Proportion of range method',
        },
      ],
      series: [
        { dataKey: 'range_normalized' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#ccb974'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Proportion of variance method',
        },
      ],
      series: [
        { dataKey: 'variance_normalized' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#64b5cd'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Proportion of standard_deviation method',
        },
      ],
      series: [
        { dataKey: 'standard_deviation_normalized' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#4c72b0'],
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Proportion of boxplot method',
        },
      ],
      series: [
        { dataKey: 'boxplot_normalized' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    ],
    dataProcessingFunction: (SampleData = questions7Data) => {

      if (SampleData != undefined) {
        let years = [...new Set(SampleData.map((item: { year: unknown }) => item.year))];
        years = years.filter((item)=> item != 1994 && item != 1993 )
        years = years.map((value)=>{
          return {"year": value}
        })

        let processedData = years.map((value, index)=>{
    
          let filteredData = SampleData.filter((dataValue)=>{
            return dataValue.year == value.year
          })
          let result = {"year":value.year, "total": 0};
    
          filteredData.forEach((valueObject, index)=>{
            Object.keys(valueObject).forEach((method, index)=>{
              if (valueObject[method] > 0 && method != "year" ) {
                if (result.hasOwnProperty(method)) {
                  result[method] = result[method] + valueObject[method];
                } else {  
                  result[method] = valueObject[method];
                }
    
                result.total = result.total + 1;
              }
            })
          })
    
          Object.keys(result).forEach((resultValue)=>{
            if(resultValue != "year" && resultValue != "total"){
              result[resultValue + "_normalized"] = Number((result[resultValue] / result.total).toFixed(2));
            }
          })
          return result;
        })
    
        processedData.sort((a,b)=>{ return a.year - b.year });
    
        return processedData;
      }
    },
    dataAnalysisInformation:{
      question: 'How has the use of statistical methods evolved over time?'
    }
  },
  {
    title: 'Number of papers per year',
    id: 8,
    uid: 'query_8',
    chartSetting: [{
      className: 'fullWidth',
      barLabel: 'value',
      colors: ['#5975a4'],
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Number of papers reporting threats to validity',
        },
      ],
      series: [
        { dataKey: 'total' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      className: 'fullWidth',
      xAxis: xAxisSettings(),
      barLabel: 'value',
      yAxis: [
        {
          label: 'Proportion of papers reporting threats to validity',
        },
      ],
      series: [
        { dataKey: 'normalized' },
      ],
      height: chartHeight,
      sx: chartStyles,
    }],
    dataProcessingFunction: (SampleData = questions8Data) => {

      if (SampleData != undefined) {
        let years = [...new Set(SampleData.map((item: { year: unknown }) => item.year))]
      
        let processedData = years.map((value, index)=>{
    
          let filteredData = SampleData.filter((dataValue)=>{
            return dataValue.year == value  
          })
          let result = {"year":value, "total": 0, 'grandTotal': 0, "normalized": 0};
    
          filteredData.forEach((valueObject, index)=>{
            if(Object.values(valueObject).includes(1)){
              result.total = result.total + 1;
            }
            result.grandTotal = result.grandTotal + 1;
          })

          result.normalized = Number((result.total / result.grandTotal).toFixed(2))

          return result;
        })
    
        processedData.sort((a,b)=>{ return a.year - b.year });
        return processedData;
      }
    },
    dataAnalysisInformation:{
      question: 'How has the reporting of threats to validity evolved over time?'
    }
  },
  {
    title: 'Number of papers per year',
    id: 9,
    uid: 'query_9',
    chartSetting: [{
      layout: "horizontal",
      className: 'fullWidth',
      colors: ['#5975a4'],
      barLabel: "value",
      yAxis: [
        { scaleType: 'band', dataKey: 'method' }
      ],
      series: [
        { dataKey: 'count' }
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      layout: "horizontal",
      className: 'fullWidth',
      colors: ['#5975a4'],
      barLabel: "value",
      yAxis: [
        { scaleType: 'band', dataKey: 'method' }
      ],
      series: [
        { dataKey: 'normalized' }
      ],
      height: chartHeight,
      sx: chartStyles,
    }],
    dataProcessingFunction: (SampleData = questions9Data) => {

      if (SampleData != undefined) {
        let processedData = {};
        let grandTotal = 0;

        SampleData.forEach((valueObject, index)=>{
          Object.keys(valueObject).forEach((method)=>{
            if (processedData.hasOwnProperty(method) && method != "year" && method != "paper") {
              processedData[method] = processedData[method] + valueObject[method]
            } else if (!processedData.hasOwnProperty(method) && method != "year" && method != "paper") {
              processedData[method] = valueObject[method]
            }
          })
          if(Object.values(valueObject).includes(1)){
            grandTotal = grandTotal + 1;
          }
        })
    
        let result = [];
    
        Object.entries(processedData).forEach((value)=>{
          result.push({
            "method": value[0],
            "count": value[1],
            "normalized": Number((value[1] / grandTotal).toFixed(3))
          })
        })
        return result;
      }
    },
    dataAnalysisInformation:{
      question: 'What types of threats to validity do the authors report?'
    }
  },
  {
    title: 'Number of papers per year',
    id: 10,
    uid: 'query_10',
    chartSetting: [{
      className: 'fullWidth',
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'case study ratio', label: "Case Study" },
        { dataKey: 'action research ratio', label: "Action Research" }
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'case study ratio'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'action research ratio'},
      ],
      height: chartHeight,
      sx: chartStyles,
    }],
    dataProcessingFunction: (SampleData = questions10Data) => {

      if (SampleData != undefined) {
        let years = [...new Set(SampleData.map((item: { year: unknown }) => item.year))]
      
        let processedData = years.map((year) => {
          let filteredData = SampleData.filter((data) => data.year === year);
        
          let uniquePapers = [...new Set(filteredData.map((item) => item.paper))];
          let totalUniquePapers = uniquePapers.length;
        
          let result = {
            year: year,
            total: totalUniquePapers, 
            "case study": 0,
            "action research": 0,
            "case study ratio": 0,
            "action research ratio": 0,
          };
        
          let caseStudyPapers = new Set();
          let actionResearchPapers = new Set();
        
          filteredData.forEach((entry) => {
            if (entry.dc_method_type_label === "case study") {
              caseStudyPapers.add(entry.paper);
            } else if (entry.dc_method_type_label === "action research") {
              actionResearchPapers.add(entry.paper);
            }
          });
        
          result["case study"] = caseStudyPapers.size;
          result["action research"] = actionResearchPapers.size;
        
          result["case study ratio"] = totalUniquePapers ? Number((caseStudyPapers.size / totalUniquePapers).toFixed(2)) : 0;
          result["action research ratio"] = totalUniquePapers ? Number((actionResearchPapers.size / totalUniquePapers).toFixed(2)) : 0;
        
          return result;
        });
        processedData.sort((a,b)=>{ return a.year - b.year });
        return processedData;
      }
    },
    dataAnalysisInformation:{
      question: 'How have the proportions of case studies and action research in the empirical methods used evolved over time?'
    }
  },
  {
    title: 'Number of papers per year',
    id: 11,
    uid: 'query_11',
    chartSetting: [{
      className: 'fullWidth',
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'count' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      className: 'fullWidth',
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'normalized'},
      ],
      height: chartHeight,
      sx: chartStyles,
    }],
    dataProcessingFunction: (SampleData = questions11Data) => {

      if (SampleData != undefined) {
        let years = [...new Set(SampleData.map((item: { year: unknown }) => item.year))]
      
        let processedData = years.map((year) => {
          // Get unique papers for the year
          let uniquePapers = [...new Set(SampleData.filter((data) => data.year === year).map((data) => data.paper))];
          let totalPapers = uniquePapers.length;
        
          // Count papers with at least one valid URL
          let papersWithURLs = new Set(
            SampleData.filter((data) => data.year === year && data.url && data.url.trim().length > 0)
                     .map((data) => data.paper)
          ).size;
        
          return {
            year: year,
            totalPapers: totalPapers,
            count: papersWithURLs,
            normalized: totalPapers > 0 ? +(papersWithURLs / totalPapers).toFixed(2) : 0
          };
        });
    
        processedData.sort((a,b)=>{ return a.year - b.year });
        return processedData;
      }
    },
    dataAnalysisInformation:{
      question: 'How has the provision of data (the materials used, raw data collected, and study results identified) evolved over time?'
    }
  },
  {
    title: 'Number of papers per year',
    id: 12,
    uid: 'query_12',
    chartSetting: [{
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'high_q_high_a'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'high_q_hid_a'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'hid_q_high_a'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'hid_q_hid_a'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'high_q_high_a_normalized'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'high_q_hid_a_normalized'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'hid_q_high_a_normalized'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'hid_q_hid_a_normalized'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'no_rq_high_a'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'no_rq_hid_a'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'no_rq_high_a_normalized'},
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'no_rq_hid_a_normalized'},
      ],
      height: chartHeight,
      sx: chartStyles,
    }],
    dataProcessingFunction: (SampleData = questions12Data) => {

      if (SampleData != undefined) {
        const papersByYear = {};
    
        SampleData.forEach(({ paper, year, question, highlighted_q, highlighted_a }) => {
            if (!papersByYear[year]) {
                papersByYear[year] = {
                    totalPapers: new Set(),
                    high_q_high_a: new Set(), high_q_hid_a: new Set(),
                    hid_q_high_a: new Set(), hid_q_hid_a: new Set(),
                    no_rq_high_a: new Set(), no_rq_hid_a: new Set()
                };
            }
            
            papersByYear[year].totalPapers.add(paper);
            
            if (question !== "No question") {
                if (highlighted_q && highlighted_a) {
                    papersByYear[year].high_q_high_a.add(paper);
                } else if (highlighted_q && !highlighted_a) {
                    papersByYear[year].high_q_hid_a.add(paper);
                } else if (!highlighted_q && highlighted_a) {
                    papersByYear[year].hid_q_high_a.add(paper);
                } else {
                    papersByYear[year].hid_q_hid_a.add(paper);
                }
            } else {
                if (highlighted_a) {
                    papersByYear[year].no_rq_high_a.add(paper);
                } else {
                    papersByYear[year].no_rq_hid_a.add(paper);
                }
            }
        });
        
        let processedData = Object.entries(papersByYear).map(([year, data]) => {
            const totalPapersCount = data.totalPapers.size || 1;
            return {
                year: parseInt(year),
                high_q_high_a: data.high_q_high_a.size,
                high_q_hid_a: data.high_q_hid_a.size,
                hid_q_high_a: data.hid_q_high_a.size,
                hid_q_hid_a: data.hid_q_hid_a.size,
                no_rq_high_a: data.no_rq_high_a.size,
                no_rq_hid_a: data.no_rq_hid_a.size,
                high_q_high_a_normalized: parseFloat((data.high_q_high_a.size / totalPapersCount).toFixed(2)),
                high_q_hid_a_normalized: parseFloat((data.high_q_hid_a.size / totalPapersCount).toFixed(2)),
                hid_q_high_a_normalized: parseFloat((data.hid_q_high_a.size / totalPapersCount).toFixed(2)),
                hid_q_hid_a_normalized: parseFloat((data.hid_q_hid_a.size / totalPapersCount).toFixed(2)),
                no_rq_high_a_normalized: parseFloat((data.no_rq_high_a.size / totalPapersCount).toFixed(2)),
                no_rq_hid_a_normalized: parseFloat((data.no_rq_hid_a.size / totalPapersCount).toFixed(2))
            };
        });

        processedData.sort((a,b)=>{ return a.year - b.year });
        return processedData;
      }
    },
    dataAnalysisInformation:{
      question: 'How has the reporting of research questions and answers evolved over time?'
    }
  },
  {
    title: 'Number of papers per year',
    id: 13,
    uid: 'query_13',
    chartSetting: [{
      layout: "horizontal",
      className: 'fullWidth',
      colors: ['#5975a4'],
      barLabel: "value",
      yAxis: [
        { scaleType: 'band', dataKey: 'method' }
      ],
      series: [
        { dataKey: 'count' }
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      layout: "horizontal",
      className: 'fullWidth',
      colors: ['#5975a4'],
      barLabel: "value",
      yAxis: [
        { scaleType: 'band', dataKey: 'method' }
      ],
      series: [
        { dataKey: 'normalized' }
      ],
      height: chartHeight,
      sx: chartStyles,
    }],
    dataProcessingFunction: (SampleData = questions13Data) => {

      if (SampleData != undefined) {
        let methods = [...new Set(SampleData.map((item) => item.dc_method_name))];

        let result = [];
    
        methods.forEach((methodValue)=>{
          let count = SampleData.filter((value)=> value.dc_method_name == methodValue).length;
          result.push({
            "method": methodValue,
            "count": count,
            "normalized": Number((count / SampleData.length).toFixed(2))
          })
        })
    
    
        result.sort((a, b)=>{ return b.count - a.count });
        return result;
      }
    },
    dataAnalysisInformation:{
      question: 'How has the provision of data (the materials used, raw data collected, and study results identified) evolved over time?'
    }
  },
  {
    title: 'Number of papers per year',
    id: 14,
    uid: 'query_14',
    chartSetting: [{
      colors: ['#5975a4', "#dd8452", "#55a868", "#c44e52", "#8172b3", "#937860", "#da8bc3", "#8c8c8c", "#ccb974", "#64b5cd"],
      className: 'fullWidth',
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'normalized_archive_analysis', label: 'Archive Analysis' },
        { dataKey: 'normalized_systematic_literature_review', label: 'Systematic Literature Review' },
        { dataKey: 'normalized_literature_review', label: 'Literature Review' },
        { dataKey: 'normalized_systematic_literature_map', label: 'Systematic Literature Map' },
        { dataKey: 'normalized_systematic_review', label: 'Systematic Review' },
        { dataKey: 'normalized_tertiary_literature_review', label: 'Tertiary literature review' },
        { dataKey: 'normalized_document_analysis', label: 'Document analysis' },
        { dataKey: 'normalized_document_inspection', label: 'Document Inspection' },
        { dataKey: 'normalized_literature_study', label: 'Literature Study' },
        { dataKey: 'normalized_literature_survey', label: 'Literature Survey' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'normalized_archive_analysis' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#cc8963'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'normalized_systematic_literature_review' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5f9e6e'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'normalized_literature_review' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#857aab'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'normalized_systematic_literature_map' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#8d7866'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'normalized_systematic_review' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#d095bf'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'tertiary_literature_review' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#8c8c8c'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'normalized_document_analysis' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#c1b37f'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'normalized_document_inspection' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#71aec0'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'normalized_literature_study' },
      ],
      height: chartHeight,
      sx: chartStyles,
    },
    {
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings(),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'normalized_literature_survey' },
      ],
      height: chartHeight,
      sx: chartStyles,
    }],
    dataProcessingFunction: (SampleData = questions14Data) => {

      if (SampleData != undefined) {
        const uniquePapers = {};
        SampleData.forEach(entry => {
            uniquePapers[entry.year] = uniquePapers[entry.year] || new Set();
            uniquePapers[entry.year].add(entry.paper);
        });
        const papersPerYear = Object.fromEntries(
            Object.entries(uniquePapers).map(([year, papers]) => [year, papers.size])
        );
        
        // Count occurrences of each empirical method per year
        const methodCounts = {};
        SampleData.forEach(({ year, dc_method_name }) => {
            if (!methodCounts[year]) methodCounts[year] = {};
            methodCounts[year][dc_method_name.replace(/\s+/g, '_')] = (methodCounts[year][dc_method_name.replace(/\s+/g, '_')] || 0) + 1;
        });
        
        // Normalize values and structure output
        const resultArray = Object.entries(methodCounts).map(([year, methods]) => {
            const normalized = {};
            Object.entries(methods).forEach(([method, count]) => {
                normalized[method] = count;
                normalized[`normalized_${method}`] = parseFloat((count / papersPerYear[year]).toFixed(2));
            });
            return { year: parseInt(year), ...normalized };
        });

        return resultArray;
      }
    },
    dataAnalysisInformation:{
      question: 'How has the proportions of empirical methods to conduct (systematic literature) reviews, so-called secondary research, evolved over time?'
    }
  },
  {
    title: 'Number of papers per year',
    id: 15.1,
    uid: 'query_15_1',
    chartSetting: [
    {
      className: 'fullWidth',
      colors: ['#5975a4'],
      barLabel: "value",
      xAxis: xAxisSettings('methodDistribution'),
      yAxis: [
        {
          label: 'Proportions of empirical methods used',
        },
      ],
      series: [
        { dataKey: 'count'},
      ],
      height: chartHeight,
      sx: chartStyles,
    }],
    dataProcessingFunction: (SampleData = questions15Data, SampleData2 = questions15_2Data) => {

      if (SampleData != undefined) {
            // Create a map for SampleData
            const dataMap = new Map();
            SampleData.forEach(entry => {
                dataMap.set(entry.paper, {
                    number_of_dc_methods: entry.number_of_dc_methods || 0,
                    number_of_inf_methods: 0,
                    number_of_des_methods: 0,
                    number_of_ml_methods: 0,
                    number_of_other_methods: 0
                });
            });
        
            // Merge SampleData2 into the map
            SampleData2.forEach(entry => {
                if (dataMap.has(entry.paper)) {
                    const existing = dataMap.get(entry.paper);
                    existing.number_of_inf_methods += entry.number_of_inf_methods || 0;
                    existing.number_of_des_methods += entry.number_of_des_methods || 0;
                    existing.number_of_ml_methods += entry.number_of_ml_methods || 0;
                    existing.number_of_other_methods += entry.number_of_other_methods || 0;
                } else {
                    dataMap.set(entry.paper, {
                        number_of_dc_methods: 0,
                        number_of_inf_methods: entry.number_of_inf_methods || 0,
                        number_of_des_methods: entry.number_of_des_methods || 0,
                        number_of_ml_methods: entry.number_of_ml_methods || 0,
                        number_of_other_methods: entry.number_of_other_methods || 0
                    });
                }
            });
        
            // Aggregate data by empirical method count
            const methodCounts = {};
            dataMap.forEach(entry => {
                const numberOfAllMethods = entry.number_of_dc_methods +
                    entry.number_of_inf_methods +
                    entry.number_of_des_methods +
                    entry.number_of_ml_methods +
                    entry.number_of_other_methods;
        
                if (!methodCounts[numberOfAllMethods]) {
                    methodCounts[numberOfAllMethods] = { count: 0, methodDistribution: numberOfAllMethods };
                }
                methodCounts[numberOfAllMethods].count++;
            });
        
            // Convert object to sorted array
            const sortedMethodCounts = Object.values(methodCounts).sort((a, b) => a.methodDistribution - b.methodDistribution);
        
            // Compute total count for normalization
            const totalPapers = sortedMethodCounts.reduce((sum, data) => sum + data.count, 0);
        
            // Construct the result array
            const result = sortedMethodCounts.map(entry => ({
                methodDistribution: entry.methodDistribution,
                count: entry.count,
                normalized: parseFloat((entry.count / totalPapers).toFixed(3))
            }));
        console.log(result);
        return result;
      }
    },
    dataAnalysisInformation:{
      question: 'How many different research methods are used per publication?'
    }
  },
];

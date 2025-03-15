import { useEffect, useState } from 'react';
import data from '../../../data/query_4.1_data_2025-02-27.json'
import data2 from '../../../data/query_4.2_data_2025-02-27.json'
import { axisClasses, BarChart } from '@mui/x-charts';
import BarChartCustom from '../CustomCharts2/BarChartCustom';

const Questions4 = () => {

  const [chart1, setchart1] = useState();
  const [chart2, setchart2] = useState();


  const chartSetting = {
    width: 1200,
    height: 500,
    sx: {
      [`.${axisClasses.left} .${axisClasses.label}`]: {
        transform: 'translate(-20px, 0)',
      },
    },
  };


  function processChart1(SampleData:[]) {

    let processedData = {}

      SampleData.forEach((value: {dc_method_type_label: string}, index)=>{
        if (value.dc_method_type_label == "action research" || value.dc_method_type_label == "case study" || value.dc_method_type_label == "experiment"|| value.dc_method_type_label == "interview" || value.dc_method_type_label == "secondary research" || value.dc_method_type_label == "survey" || value.dc_method_type_label == "secondary research" ) {
          if (processedData.hasOwnProperty(value.dc_method_type_label)) {
            processedData[value.dc_method_type_label] = processedData[value.dc_method_type_label] + 1;
          } else{
            processedData[value.dc_method_type_label] = 1;
          }  
        } else {
          if (processedData.hasOwnProperty("others")) {
            processedData.others = processedData.others + 1;
          } else {
            processedData.others = 1
          }
        }
      })

    let result = Object.entries(processedData).map((value, index)=>{
       return {"method":value[0], "count": value[1], "ratio": Number((value[1]/SampleData.length).toFixed(3))}
    })

    setchart1(result);
  }

  function processChart2(SampleData:[]) {

    let processedData = {}

    SampleData.forEach((value, index)=>{

      if (value.descriptive == "descriptive") {
        if (processedData.hasOwnProperty(value.descriptive)) {
          processedData[value.descriptive] = processedData[value.descriptive] + 1;
        } else{
          processedData[value.descriptive] = 1;
        } 
      } 

      if (value.inferential == "inferential") {
        if (processedData.hasOwnProperty(value.inferential)) {
          processedData[value.inferential] = processedData[value.inferential] + 1;
        } else{
          processedData[value.inferential] = 1;
        } 
      } 
      
      if (value.machine_learning == "machine learning") {
        if (processedData.hasOwnProperty(value.machine_learning)) {
          processedData[value.machine_learning] = processedData[value.machine_learning] + 1;
        } else{
          processedData[value.machine_learning] = 1;
        } 
      }

      if (value.machine_learning == "" && value.inferential == "" && value.descriptive == "") {
        if (processedData.hasOwnProperty("others")) {
          processedData["others"] = processedData["others"] + 1;
        } else{
          processedData["others"] = 1;
        } 
      }
    })

    let result = Object.entries(processedData).map((value, index)=>{
       return {"method":value[0], "count": value[1], "ratio": Number((value[1]/SampleData.length).toFixed(3))}
    })
    
    setchart2(result);
  }

  useEffect(()=>{
    processChart1(data)
    processChart2(data2)
  }, [])

  return (
    <div>
      { chart1 ? 
        <>
          <BarChartCustom layout="horizontal" settings={chartSetting} heading={"Number of empirical methods used for data collection"} data={chart1} chartConfig={ {
            "yaxis": [{ scaleType: 'band', dataKey: 'method' }],
            "series": [
              { dataKey: 'count' }
            ],
          } } />  
          <BarChartCustom layout="horizontal" settings={chartSetting} heading={"Normalized number of empirical methods used for data collection"} data={chart1} chartConfig={{
            "yaxis": [{ scaleType: 'band', dataKey: 'method' }],
            "series": [
              { dataKey: 'ratio' }
            ],
          }} />  
        </>
      : '' }

      { chart2 ? 
        <>
          <BarChartCustom layout="horizontal" settings={chartSetting} heading={"Number of empirical methods used for data analysis"} data={chart2} chartConfig={ {
            "yaxis": [{ scaleType: 'band', dataKey: 'method' }],
            "series": [
              { dataKey: 'count' }
            ],
          } } />  
          <BarChartCustom layout="horizontal" settings={chartSetting} heading={"Normalized number of empirical methods used for data analysis"} data={chart2} chartConfig={{
            "yaxis": [{ scaleType: 'band', dataKey: 'method' }],
            "series": [
              { dataKey: 'ratio' }
            ],
          }} />  
        </>
      : '' }
    </div>
  )
}

export default Questions4





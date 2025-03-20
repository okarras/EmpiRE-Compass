import { useEffect, useState } from 'react';
import data from '../../../data/query_9_data_2025-02-27.json'
import { axisClasses } from '@mui/x-charts';
import BarChartCustom from '../CustomCharts2/BarChartCustom';

const Questions9 = () => {

  const [chart1, setchart1] = useState();


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
      
    let processedData = {};

    SampleData.forEach((valueObject, index)=>{
      Object.keys(valueObject).forEach((method)=>{
        if (processedData.hasOwnProperty(method) && method != "year" && method != "paper") {
          processedData[method] = processedData[method] + valueObject[method]
        } else if (!processedData.hasOwnProperty(method) && method != "year" && method != "paper") {
          processedData[method] = valueObject[method]
        }
      })
    })

    let result = [];

    Object.entries(processedData).forEach((value)=>{
      result.push({
        "method": value[0],
        "count": value[1]
      })
    })
    // processedData.sort((a,b)=>{ return a.year - b.year });
    setchart1(result)
  }

  useEffect(()=>{
    processChart1(data)
  }, [])

  return (
    <div>
      { chart1 ? 
        <>
        <BarChartCustom layout="horizontal" settings={chartSetting} heading={"Number of papers without an empirical study per year"} data={chart1} chartConfig={ {
          "yaxis": [{ scaleType: 'band', dataKey: 'method' }],
          "series": [
            { dataKey: 'count' },
          ],
        } } />
        <BarChartCustom layout="horizontal" settings={chartSetting} heading={"Normalized number of papers without an empirical study per year"} data={chart1} chartConfig={ {
          "yaxis": [{ scaleType: 'band', dataKey: 'method' }],
          "series": [
            { dataKey: 'count' },
          ],
        } } />
        </>
      : '' }
    </div>
  )
}

export default Questions9





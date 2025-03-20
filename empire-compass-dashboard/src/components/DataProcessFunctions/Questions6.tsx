import { useEffect, useState } from 'react';
import data from '../../../data/query_6.1_data_2024-07-26.json'
import { axisClasses } from '@mui/x-charts';
import BarChartCustom from '../CustomCharts2/BarChartCustom';

const Questions6 = () => {

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

    setchart1(result);

  }

  useEffect(()=>{
    processChart1(data)
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
          <BarChartCustom layout="horizontal" settings={chartSetting} heading={"Number of empirical methods used for data collection"} data={chart1} chartConfig={ {
            "yaxis": [{ scaleType: 'band', dataKey: 'method' }],
            "series": [
              { dataKey: 'ratio' }
            ],
          } } />  
        </>
      : '' }
    </div>
  )
}

export default Questions6





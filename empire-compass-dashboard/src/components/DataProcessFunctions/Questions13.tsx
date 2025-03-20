import { useEffect, useState } from 'react';
import data from '../../../data/query_13_data_2025-02-27.json'
import { axisClasses } from '@mui/x-charts';
import BarChartCustom from '../CustomCharts2/BarChartCustom';

const Questions13 = () => {

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
    let methods = [...new Set(SampleData.map((item) => item.dc_method_name))];

    let result = [];

    methods.forEach((methodValue)=>{
      result.push({
        "method": methodValue,
        "count": SampleData.filter((value)=> value.dc_method_name == methodValue).length
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
        </>
      : '' }
    </div>
  )
}

export default Questions13





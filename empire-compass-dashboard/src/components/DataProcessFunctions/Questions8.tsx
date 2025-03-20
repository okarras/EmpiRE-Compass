import { useEffect, useState } from 'react';
import data from '../../../data/query_8_data_2025-02-27.json'
import { axisClasses } from '@mui/x-charts';
import BarChartCustom from '../CustomCharts2/BarChartCustom';

const Questions8 = () => {

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

    let years = [...new Set(SampleData.map((item: { year: unknown }) => item.year))]
      
    let processedData = years.map((value, index)=>{

      let filteredData = SampleData.filter((dataValue)=>{
        return dataValue.year == value  
      })
      let result = {"year":value, "total": 0};

      filteredData.forEach((valueObject, index)=>{
        if(Object.values(valueObject).includes(1)){
          result.total = result.total + 1;
        }
      })
      return result;
    })

    processedData.sort((a,b)=>{ return a.year - b.year });
    setchart1(processedData)
  }

  useEffect(()=>{
    processChart1(data)
  }, [])

  return (
    <div>
      { chart1 ? 
        <>
        <BarChartCustom settings={chartSetting} heading={"Number of papers without an empirical study per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'total' },
          ],
        } } />
        <BarChartCustom settings={chartSetting} heading={"Normalized number of papers without an empirical study per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'total' },
          ],
        } } />
        </>
      : '' }
    </div>
  )
}

export default Questions8





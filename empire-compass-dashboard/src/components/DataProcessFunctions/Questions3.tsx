import { useEffect, useState } from 'react';
import data from '../../../data/query_3_data_2025-02-27.json'
import { axisClasses } from '@mui/x-charts';
import BarChartCustom from '../CustomCharts2/BarChartCustom';

const Questions3 = () => {

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
    setchart1(itemsPerYear);
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
            { dataKey: 'count', label: 'Case study' },
          ],
        } } />
        <BarChartCustom settings={chartSetting} heading={"Normalized number of papers without an empirical study per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'ratio', label: 'Case study' },
          ],
        } } />
        </>
      : '' }
    </div>
  )
}

export default Questions3





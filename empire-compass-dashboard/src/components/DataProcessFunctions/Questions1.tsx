import { useEffect, useState } from 'react';
import data from '../../../data/query_1_data_2024-07-26.json'
import { axisClasses, BarChart } from '@mui/x-charts';
import BarChartCustom from '../CustomCharts2/BarChartCustom';

const Questions1 = () => {

  const [mainData1, setmainData1] = useState();
  const [mainData2, setmainData2] = useState();

  const chartSetting = {
    width: 1200,
    height: 500,
    sx: {
      [`.${axisClasses.left} .${axisClasses.label}`]: {
        transform: 'translate(-20px, 0)',
      },
    },
  };

  function processData1(SampleData:[]) {
    let chartData = SampleData;
  
    chartData.sort((a: { year: number }, b: { year: number }) => a.year - b.year);
    
    const dataYears = [
      ...new Set(chartData.map((item: { year: number }) => item.year)),
    ];
  
    const itemsPerYear = dataYears.map((year) => {
      return {
        count: chartData.filter((item: { year: number, dc_label: string, da_label: string }) => item.year === year && item.dc_label == 'collection' && item.da_label == 'analysis' )
          .length,
        year: year,
      };
    }); 
    
    setmainData1(itemsPerYear)
    return itemsPerYear;
  }

  function processData2(papers) {
    const totalPapersPerYear = {};
    const seenPapers = new Set();

    papers.forEach(({ paper, year }) => {
      if (!seenPapers.has(paper)) {
        seenPapers.add(paper);
        totalPapersPerYear[year] = (totalPapersPerYear[year] || 0) + 1;
      }
    });

    const empiricalPapersPerYear = {};
    const seenEmpiricalPapers = new Set();

    papers.forEach(({ paper, year, dc_label, da_label }) => {
      const isEmpirical = dc_label !== "no collection" && da_label !== "no analysis";

      if (isEmpirical && !seenEmpiricalPapers.has(paper)) {
        seenEmpiricalPapers.add(paper);
        empiricalPapersPerYear[year] = (empiricalPapersPerYear[year] || 0) + 1;
      }
    });

    let results = Object.keys(totalPapersPerYear).map(year => ({
      year: Number(year),
      ratio: +( (empiricalPapersPerYear[year] || 0) / totalPapersPerYear[year] ).toFixed(2),
    }));

    setmainData2(results);
  }

  useEffect(()=>{
    processData1(data)
    processData2(data)
  }, [])

  return (
    <div>
      { mainData1 ? 
        <BarChartCustom settings={chartSetting} 
        data={mainData1} 
        heading={"Number of papers with an empirical study per year"}
        chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            {dataKey: 'count'}
          ],
        } } /> : '' }
        
        { mainData1 ? 
        <BarChartCustom settings={chartSetting} 
        data={mainData2} 
        heading={"Normalized number of papers with an empirical study per year"} 
        chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            {dataKey: 'ratio'}
          ],
      } } /> : '' }
    </div>
  )
}

export default Questions1





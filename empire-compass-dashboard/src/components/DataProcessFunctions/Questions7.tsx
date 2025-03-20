import { useEffect, useState } from 'react';
import data from '../../../data/query_7.1_data_2025-02-27.json'
import { axisClasses } from '@mui/x-charts';
import BarChartCustom from '../CustomCharts2/BarChartCustom';

const Questions7 = () => {

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

    let years = [...new Set(SampleData.map((item: { year: unknown }) => item.year))];
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

    setchart1(processedData);
  }

  useEffect(()=>{
    processChart1(data)
  }, [])

  return (
    <div>
      { chart1 ? 
        <>
        <BarChartCustom showLabel={false} settings={chartSetting} heading={"Number of empirical methods used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
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
        } } />
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr"}}>
          <BarChartCustom settings={chartSetting} heading={"Number of case studies used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'count', label: 'count' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of experiments used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'percent', label: 'percent' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of surveys used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'mean', label: 'mean' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of interviews used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'median', label: 'median' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of secondary research used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'mode', label: 'mode' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of actions research used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'minimum', label: 'minimum' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of other methods used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'maximum', label: 'maximum' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of other methods used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'range', label: 'range' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of other methods used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'variance', label: 'variance' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of other methods used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'standard_deviation', label: 'standard_deviation' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of other methods used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'boxplot', label: 'boxplot' },
            ],
          } } />
        </div>


        <BarChartCustom showLabel={false} settings={chartSetting} heading={"Number of empirical methods used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
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
        } } />
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr"}}>
          <BarChartCustom settings={chartSetting} heading={"Number of case studies used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'count_normalized', label: 'count' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of experiments used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'percent_normalized', label: 'percent' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of surveys used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'mean_normalized', label: 'mean' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of interviews used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'median_normalized', label: 'median' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of secondary research used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'mode_normalized', label: 'mode' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of actions research used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'minimum_normalized', label: 'minimum' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of other methods used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'maximum_normalized', label: 'maximum' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of other methods used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'range_normalized', label: 'range' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of other methods used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'variance_normalized', label: 'variance' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of other methods used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'standard_deviation_normalized', label: 'standard_deviation' },
            ],
          } } />
          <BarChartCustom settings={chartSetting} heading={"Number of other methods used for data collection per year"} data={chart1} chartConfig={ {
            "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
            "series": [
              { dataKey: 'boxplot_normalized', label: 'boxplot' },
            ],
          } } />
        </div>
        </>

        
      : '' }
    </div>
  )
}

export default Questions7





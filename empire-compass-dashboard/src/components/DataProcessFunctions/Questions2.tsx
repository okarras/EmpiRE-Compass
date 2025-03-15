import { useEffect, useState } from 'react';
import data from '../../../data/query_2.1_data_2024-07-26.json'
import { axisClasses } from '@mui/x-charts';
import BarChartCustom from '../CustomCharts2/BarChartCustom';

const Questions2 = () => {

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

    setchart1(processedData);
  }

  useEffect(()=>{
    processChart1(data)
  }, [])

  return (
    <div>
      { chart1 ? 
        <>
        <BarChartCustom settings={chartSetting} heading={"Number of empirical methods used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'case study', label: 'case study' },
            { dataKey: 'experiment', label: 'Experiment' },
            { dataKey: 'survey', label: 'Survey' },
            { dataKey: 'interview', label: 'Interview' },
            { dataKey: 'secondary research', label: 'Secondary research' },
            { dataKey: 'action research', label: 'action research' },
            { dataKey: 'others', label: 'Other' }
          ],
        } } />
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr"}}>
        <BarChartCustom settings={chartSetting} heading={"Number of case studies used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'case study', label: 'Case study' },
          ],
        } } />
        <BarChartCustom settings={chartSetting} heading={"Number of experiments used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'experiment', label: 'Experiment' },
          ],
        } } />
        <BarChartCustom settings={chartSetting} heading={"Number of surveys used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'survey', label: 'Survey' },
          ],
        } } />
        <BarChartCustom settings={chartSetting} heading={"Number of interviews used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'interview', label: 'Interview' },
          ],
        } } />
        <BarChartCustom settings={chartSetting} heading={"Number of secondary research used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'secondary research', label: 'Secondary research' },
          ],
        } } />
        <BarChartCustom settings={chartSetting} heading={"Number of actions research used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'action research', label: 'action research' },
          ],
        } } />
        <BarChartCustom settings={chartSetting} heading={"Number of other methods used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'others', label: 'Other' },
          ],
        } } />
        </div>


        <BarChartCustom settings={chartSetting} heading={"Normalized number of empirical methods used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'case study ratio', label: 'case study' },
            { dataKey: 'experiment ratio', label: 'Experiment' },
            { dataKey: 'survey ratio', label: 'Survey' },
            { dataKey: 'interview ratio', label: 'Interview' },
            { dataKey: 'secondary research ratio', label: 'Secondary research' },
            { dataKey: 'action research ratio', label: 'action research' },
            { dataKey: 'others ratio', label: 'Other' }
          ],
        } } />
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr"}}>
        <BarChartCustom settings={chartSetting} heading={"Normalized number of case studies used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'case study ratio', label: 'Case study' },
          ],
        } } />
        <BarChartCustom settings={chartSetting} heading={"Normalized number of experiments used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'experiment ratio', label: 'Experiment' },
          ],
        } } />
        <BarChartCustom settings={chartSetting} heading={"Normalized number of surveys used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'survey ratio', label: 'Survey' },
          ],
        } } />
        <BarChartCustom settings={chartSetting} heading={"Normalized number of interviews used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'interview ratio', label: 'Interview' },
          ],
        } } />
        <BarChartCustom settings={chartSetting} heading={"Normalized number of secondary research used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'secondary research ratio', label: 'Secondary research' },
          ],
        } } />
        <BarChartCustom settings={chartSetting} heading={"Normalized number of actions research used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'action research ratio', label: 'action research' },
          ],
        } } />
        <BarChartCustom settings={chartSetting} heading={"Normalized number of other methods used for data collection per year"} data={chart1} chartConfig={ {
          "xaxis": [{ scaleType: 'band', dataKey: 'year' }],
          "series": [
            { dataKey: 'others ratio', label: 'Other' },
          ],
        } } />
        </div>
        </>

        
      : '' }
    </div>
  )
}

export default Questions2





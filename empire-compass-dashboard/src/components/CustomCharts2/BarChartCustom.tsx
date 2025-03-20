import { BarChart } from "@mui/x-charts"


const BarChartCustom = (props) => {

  return (
    <div style={{textAlign: "center"}}>
      <h4> {props.heading} </h4>
      { props.layout == 'horizontal' ? <BarChart
        style={{width: "100%", padding: "0px", height: "auto"}}
        dataset={props.data}
        yAxis={props.chartConfig.yaxis}
        series={props.chartConfig.series}
        barLabel={props.showLabel == false ? "" : "value"}
        layout="horizontal"
        {...props.settings}
      /> 
      : 
      <BarChart
      style={{width: "100%" , padding: "0px", height: "auto"}}
      dataset={props.data}
      xAxis={props.chartConfig.xaxis}
      series={props.chartConfig.series}
      barLabel={props.showLabel == false ? "" : "value"}
      {...props.settings}
    /> }
      
    </div>
  )
}

export default BarChartCustom

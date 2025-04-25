import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import type { Query } from '../constants/queries_chart_info';
import ChartParamsSelector from './CustomCharts/ChartParamsSelector';
import CustomBarChart from './CustomCharts/CustomBarChart';
import { SPARQL_QUERIES } from '../api/SPARQL_QUERIES';
import fetchSPARQLData from '../helpers/fetch_query';
import QuestionInformation from './QuestionInformation';
import QuestionDialog from './QuestionDialog';
import DataGrid, { Column, Paging, FilterRow, Sorting } from 'devextreme-react/data-grid';
// import QuestionInformationTable from './QuestionInformationTable';


const Question = ({ query }: { query: Query }) => {
  const [normalized, setNormalized] = useState(true);
  const [questionData, setQuestionData] = useState<Record<string, unknown>[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const data = await fetchSPARQLData(SPARQL_QUERIES[query.uid]);
      // console.log('Fetched Data:', data);
      setQuestionData(data);
      setLoading(false);
    };

    fetchData();
  }, [query, setQuestionData]);

  
  // if exists get column keys from the first data item
  let columnKeys: string[] = [];
  if (questionData.length > 0) {
    const firstRow = questionData[0];
    columnKeys = Object.keys(firstRow);
  }

  return (
    <Box
      sx={{
        display: 'flex',
        // justifyContent: 'center',
        // alignItems: 'center',
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: '10px',
        padding: '20px',
        flexDirection: 'column',
      }}
    >
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: '20px',
      }}>
        <h1>{`${query.id}- ${query.dataAnalysisInformation.question}`}</h1>
        <QuestionDialog query={query} />
      </Box>
      <QuestionInformation
        information={query.dataAnalysisInformation.questionExplanation}
        label="Explanation of the Competency Question"
      />
      <QuestionInformation
        information={query.dataAnalysisInformation.requiredDataForAnalysis}
        label="Required Data for Analysis"
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          width: '100%',
        }}
      >
        <ChartParamsSelector
          normalized={normalized}
          setNormalized={setNormalized}
          query={query}
        />
        <CustomBarChart
          key={`${query.uid}-barchart`}
          question_id={query.uid}
          dataset={query.dataProcessingFunction(questionData) ?? []} // Cast the dynamic value to unknown[] to match the expected type
          chartSetting={query.chartSettings}
          normalized={normalized}
          loading={loading}
        />
      </div>
      <QuestionInformation
        information={query.dataAnalysisInformation.dataAnalysis}
        label="Data Analysis"
      />
      <QuestionInformation
        information={query.dataAnalysisInformation.dataInterpretation}
        label="Data Interpretation"
      />
      <DataGrid
        dataSource={questionData}
        showBorders={true}
        rowAlternationEnabled={true}
        columnAutoWidth={true}
        wordWrapEnabled={true}
        style={{ marginTop: 20 }}
      >
        {/* <FilterRow visible={true} /> */}
        <Sorting mode="multiple" />
        <Paging defaultPageSize={15} />

        {columnKeys.map((key) => (
          <Column key={key} dataField={key} caption={key} />
        ))}
      </DataGrid>
      {questionData.length > 0 && (
        <Box sx={{ marginTop: 3, fontSize: '14px' }}>
          <p><strong>Total Rows:</strong> {questionData.length}</p>
          <p><strong>Columns:</strong> {Object.keys(questionData[0]).length}</p>
          <ul style={{ marginLeft: '1rem' }}>
            {Object.entries(questionData[0]).map(([key, _]) => {
              const nonNullCount = questionData.filter((row) => row[key] !== null && row[key] !== '').length;
              const sampleValue = questionData.find((row) => row[key])?.[key];
              const dtype = typeof sampleValue;
              return (
                <li key={key}>
                  <strong>{key}</strong>: {nonNullCount} non-null, type <code>{dtype}</code>
                </li>
              );
            })}
          </ul>
        </Box>
      )}
    </Box>
  );
};

export default Question;

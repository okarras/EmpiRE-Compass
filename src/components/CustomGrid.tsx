import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box } from '@mui/material';
import GridStats from './GridStats';

interface Props {
  questionData: Record<string, unknown>[];
  gridOptions?: {
    defaultColumns?: string[];
    defaultGroupBy?: string;
  };
}

const MuiDataGrid: React.FC<Props> = ({ questionData, gridOptions }) => {
  // Function to check if a string is a valid URL
  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  // Generate columns based on keys from the first data object
  const columns: GridColDef[] = React.useMemo(() => {
    if (questionData.length === 0) return [];

    return Object.keys(questionData[0]).map((key) => ({
      field: key,
      headerName: key,
      flex: 1,
      sortable: true,
      filterable: true,
      renderCell: (params) => {
        const value = params.value;
        // If the cell content is a URL, render it as a link
        if (typeof value === 'string' && isValidUrl(value)) {
          return (
            <a href={value} target="_blank" rel="noopener noreferrer">
              {value}
            </a>
          );
        }
        // Otherwise, just render the value
        return value;
      },
    }));
  }, [questionData]);

  // Ensure each row has a unique 'id' field
  const rows = React.useMemo(() => {
    return questionData.map((row, index) => ({
      id: row.id ?? index,
      ...row,
    }));
  }, [questionData]);

  return (
    <Box sx={{ width: '100%', marginTop: 2 }}>
      {/* Statistics Section */}
      <GridStats questionData={questionData} gridOptions={gridOptions} />

      {/* Data Grid */}
      <div style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSizeOptions={[15, 30, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 15, page: 0 } },
          }}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-row:nth-of-type(odd)': {
              backgroundColor: '#f9f9f9', // light grey for odd rows
            },
            '& .MuiDataGrid-row:nth-of-type(even)': {
              backgroundColor: '#ffffff', // white for even rows
            },
            '& .MuiDataGrid-cell': {
              whiteSpace: 'normal',
              wordWrap: 'break-word',
            },
          }}
          showToolbar
        />
      </div>
    </Box>
  );
};

export default MuiDataGrid;

import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface Props {
  questionData: Record<string, unknown>[];
}

const MuiDataGrid: React.FC<Props> = ({ questionData }) => {
  // Generate columns based on keys from the first data object
  const columns: GridColDef[] = React.useMemo(() => {
    if (questionData.length === 0) return [];

    return Object.keys(questionData[0]).map((key) => ({
      field: key,
      headerName: key,
      flex: 1,
      sortable: true,
      filterable: true,
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
    <div style={{ height: 600, width: '100%', marginTop: 20 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[15, 30, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 15, page: 0 } },
        }}
        disableRowSelectionOnClick
        autoHeight
        sx={{
          '& .MuiDataGrid-cell': {
            whiteSpace: 'normal',
            wordWrap: 'break-word',
          },
        }}
      />
    </div>
  );
};

export default MuiDataGrid;

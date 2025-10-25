import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Switch,
  FormControlLabel,
  IconButton,
  Popover,
  Badge,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  BarChart,
  Settings,
  ViewColumn,
  FilterList,
} from '@mui/icons-material';

interface Props {
  questionData: Record<string, unknown>[];
  gridOptions?: {
    defaultColumns?: string[];
    defaultGroupBy?: string;
  };
}

interface ColumnStats {
  field: string;
  uniqueValues: Map<string, number>;
  totalCount: number;
  nullCount: number;
  groupedStats?: Map<string, Map<string, number>>; // groupValue -> (valueLabel -> count)
}

const GridStats: React.FC<Props> = ({ questionData, gridOptions }) => {
  const [showStats, setShowStats] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [useUniquePapers, setUseUniquePapers] = useState(true);
  const [groupByColumn, setGroupByColumn] = useState<string>('');

  // Popover states
  const [columnsAnchor, setColumnsAnchor] = useState<HTMLButtonElement | null>(
    null
  );
  const [settingsAnchor, setSettingsAnchor] =
    useState<HTMLButtonElement | null>(null);
  const [groupByAnchor, setGroupByAnchor] = useState<HTMLButtonElement | null>(
    null
  );

  // Get all available columns
  const availableColumns = React.useMemo(() => {
    if (questionData.length === 0) return [];
    return Object.keys(questionData[0]);
  }, [questionData]);

  // Initialize defaults from gridOptions
  React.useEffect(() => {
    if (gridOptions && availableColumns.length > 0) {
      // Set default columns if provided and valid
      if (gridOptions.defaultColumns && gridOptions.defaultColumns.length > 0) {
        const validColumns = gridOptions.defaultColumns.filter((col) =>
          availableColumns.includes(col)
        );
        if (validColumns.length > 0) {
          setSelectedColumns(validColumns);
        }
      }

      // Set default group by if provided and valid
      if (
        gridOptions.defaultGroupBy &&
        availableColumns.includes(gridOptions.defaultGroupBy)
      ) {
        setGroupByColumn(gridOptions.defaultGroupBy);
      }
    }
  }, [gridOptions, availableColumns]);

  // Calculate statistics for selected columns only
  const columnStats: ColumnStats[] = React.useMemo(() => {
    if (questionData.length === 0 || selectedColumns.length === 0) return [];

    const stats: ColumnStats[] = [];

    selectedColumns.forEach((key) => {
      const uniqueValues = new Map<string, number>();
      const groupedStats = groupByColumn
        ? new Map<string, Map<string, number>>()
        : undefined;
      let nullCount = 0;
      let nonNullCount = 0;

      // If using unique papers, track which papers we've seen for each value
      const papersByValue = useUniquePapers
        ? new Map<string, Set<string>>()
        : null;
      const papersByGroup =
        useUniquePapers && groupByColumn
          ? new Map<string, Map<string, Set<string>>>()
          : null;

      questionData.forEach((row) => {
        const value = row[key];
        const paperId = String(row['paper'] || '');

        // Check for null, undefined, empty string, or string 'null'/'undefined'/'none'
        const stringLower = String(value).toLowerCase().trim();
        if (
          value === null ||
          value === undefined ||
          value === '' ||
          stringLower === 'null' ||
          stringLower === 'undefined' ||
          stringLower === 'none' ||
          stringLower === 'nan'
        ) {
          nullCount++;
        } else {
          // Always trim whitespace
          let stringValue = String(value).trim();

          // Always apply case-insensitive capitalization (like pandas str.capitalize)
          stringValue = stringValue.toLowerCase();
          stringValue =
            stringValue.charAt(0).toUpperCase() + stringValue.slice(1);

          // Track for main statistics
          if (useUniquePapers && paperId) {
            // Track unique papers per value
            if (!papersByValue!.has(stringValue)) {
              papersByValue!.set(stringValue, new Set());
            }
            papersByValue!.get(stringValue)!.add(paperId);
          } else {
            // Regular count
            uniqueValues.set(
              stringValue,
              (uniqueValues.get(stringValue) || 0) + 1
            );
          }

          // Handle grouping
          if (groupByColumn && groupedStats) {
            const groupValueRaw = row[groupByColumn];
            let groupValue = 'Unknown';

            // Apply same normalization to group values
            if (
              groupValueRaw !== null &&
              groupValueRaw !== undefined &&
              groupValueRaw !== ''
            ) {
              groupValue = String(groupValueRaw).trim();
            }

            if (!groupedStats.has(groupValue)) {
              groupedStats.set(groupValue, new Map());
            }

            if (useUniquePapers && paperId) {
              // Track unique papers per value per group
              if (!papersByGroup) {
                return; // Safety check
              }
              if (!papersByGroup.has(groupValue)) {
                papersByGroup.set(groupValue, new Map());
              }
              if (!papersByGroup.get(groupValue)!.has(stringValue)) {
                papersByGroup.get(groupValue)!.set(stringValue, new Set());
              }
              papersByGroup.get(groupValue)!.get(stringValue)!.add(paperId);
            } else {
              // Regular count per group
              const groupMap = groupedStats.get(groupValue)!;
              groupMap.set(stringValue, (groupMap.get(stringValue) || 0) + 1);
            }
          }

          nonNullCount++;
        }
      });

      // Convert unique paper sets to counts
      if (useUniquePapers && papersByValue) {
        papersByValue.forEach((papers, value) => {
          uniqueValues.set(value, papers.size);
        });

        if (papersByGroup && groupedStats) {
          papersByGroup.forEach((valueMap, groupValue) => {
            const groupMap = groupedStats.get(groupValue)!;
            valueMap.forEach((papers, value) => {
              groupMap.set(value, papers.size);
            });
          });
        }
      }

      // Calculate total count based on unique papers if enabled
      let totalCount = nonNullCount + nullCount;
      if (useUniquePapers && questionData.some((row) => row['paper'])) {
        const uniquePapers = new Set(
          questionData
            .filter((row) => row['paper'])
            .map((row) => String(row['paper']))
        );
        totalCount = uniquePapers.size;
      }

      stats.push({
        field: key,
        uniqueValues,
        totalCount,
        nullCount,
        groupedStats,
      });
    });

    return stats;
  }, [questionData, selectedColumns, useUniquePapers, groupByColumn]);

  return (
    <Accordion
      expanded={showStats}
      onChange={() => setShowStats(!showStats)}
      sx={{ mb: 2 }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          background:
            'linear-gradient(135deg, rgba(232, 97, 97, 0.08) 0%, rgba(232, 97, 97, 0.03) 100%)',
          borderBottom: '1px solid rgba(232, 97, 97, 0.1)',
          '&:hover': {
            background:
              'linear-gradient(135deg, rgba(232, 97, 97, 0.12) 0%, rgba(232, 97, 97, 0.06) 100%)',
          },
          minHeight: '64px',
        }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}
        >
          <BarChart sx={{ color: '#e86161', fontSize: 28 }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#e86161', letterSpacing: '-0.5px' }}
          >
            Column Statistics & Distribution
          </Typography>

          {gridOptions && (selectedColumns.length > 0 || groupByColumn) && (
            <Chip
              label="Defaults Applied"
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}

          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}
          >
            <Tooltip title="Select Columns">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setColumnsAnchor(e.currentTarget);
                }}
                sx={{
                  backgroundColor:
                    selectedColumns.length > 0
                      ? 'rgba(33, 150, 243, 0.1)'
                      : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.2)' },
                }}
              >
                <Badge badgeContent={selectedColumns.length} color="primary">
                  <ViewColumn
                    sx={{
                      color: selectedColumns.length > 0 ? '#1976d2' : '#757575',
                    }}
                  />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Group By">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setGroupByAnchor(e.currentTarget);
                }}
                sx={{
                  backgroundColor: groupByColumn
                    ? 'rgba(156, 39, 176, 0.1)'
                    : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(156, 39, 176, 0.2)' },
                }}
              >
                <Badge
                  variant="dot"
                  color="secondary"
                  invisible={!groupByColumn}
                >
                  <FilterList
                    sx={{ color: groupByColumn ? '#9c27b0' : '#757575' }}
                  />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Analysis Settings">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsAnchor(e.currentTarget);
                }}
                sx={{
                  backgroundColor: useUniquePapers
                    ? 'rgba(76, 175, 80, 0.1)'
                    : 'transparent',
                  '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.2)' },
                }}
              >
                <Badge
                  variant="dot"
                  color="success"
                  invisible={!useUniquePapers}
                >
                  <Settings
                    sx={{ color: useUniquePapers ? '#4caf50' : '#757575' }}
                  />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, backgroundColor: '#fafbfc' }}>
        {selectedColumns.length === 0 ? (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary">
              Please select columns from the dropdown above to view statistics
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {columnStats.map((stat) => (
              <Paper
                key={stat.field}
                elevation={3}
                sx={{
                  p: 3,
                  background:
                    'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                  maxHeight: '800px',
                  overflow: 'auto',
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    mb: 3,
                    pb: 2,
                    borderBottom: '2px solid #f0f0f0',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: '#333',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    📊 {stat.field}
                  </Typography>
                  <Chip
                    label={`${stat.uniqueValues.size} unique values`}
                    size="small"
                    color="primary"
                  />
                  <Chip
                    label={`${stat.totalCount} ${useUniquePapers ? 'unique papers' : 'total records'}`}
                    size="small"
                    color="success"
                  />
                  {stat.nullCount > 0 && (
                    <Chip
                      label={`${stat.nullCount} null/empty values excluded`}
                      size="small"
                      color="warning"
                    />
                  )}
                  {useUniquePapers && (
                    <Chip
                      label="Unique Papers Mode"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {groupByColumn && (
                    <Chip
                      label={`Grouped by: ${groupByColumn}`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Only show main statistics table when NOT grouping */}
                {!groupByColumn && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            Count
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            Percentage
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
                            Distribution
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Array.from(stat.uniqueValues.entries())
                          .sort((a, b) => b[1] - a[1]) // Sort by count descending
                          .map(([value, count]) => {
                            const percentage = (
                              (count / stat.totalCount) *
                              100
                            ).toFixed(3);
                            const displayPercentage =
                              parseFloat(percentage).toFixed(1);
                            return (
                              <TableRow key={value}>
                                <TableCell
                                  sx={{
                                    maxWidth: 300,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={value}
                                >
                                  {value}
                                </TableCell>
                                <TableCell align="right">
                                  <Chip
                                    label={count}
                                    size="small"
                                    color="default"
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-end',
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {displayPercentage}%
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ fontSize: '0.65rem' }}
                                    >
                                      ({count}/{stat.totalCount})
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <LinearProgress
                                      variant="determinate"
                                      value={parseFloat(percentage)}
                                      sx={{
                                        width: '100%',
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: '#e0e0e0',
                                        '& .MuiLinearProgress-bar': {
                                          backgroundColor: '#e86161',
                                        },
                                      }}
                                    />
                                    <Typography
                                      variant="caption"
                                      sx={{ ml: 1, minWidth: 45 }}
                                    >
                                      {displayPercentage}%
                                    </Typography>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* Grouped Statistics Section */}
                {groupByColumn && (
                  <Box sx={{ mt: 0 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        mb: 3,
                        p: 2,
                        background:
                          'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(33, 150, 243, 0.03) 100%)',
                        borderRadius: 2,
                        border: '1px solid rgba(33, 150, 243, 0.2)',
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: '#1976d2',
                          letterSpacing: '-0.3px',
                        }}
                      >
                        📈 Breakdown by {groupByColumn}
                      </Typography>
                      <Chip
                        label={`${stat.groupedStats?.size || 0} groups`}
                        size="small"
                        sx={{ fontWeight: 600 }}
                        color="info"
                      />
                    </Box>
                    {!stat.groupedStats || stat.groupedStats.size === 0 ? (
                      <Box
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          backgroundColor: '#fff3cd',
                          borderRadius: 1,
                          border: '1px solid #ffc107',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          No grouped data found for "{stat.field}". Make sure
                          the column "{groupByColumn}" exists and has values,
                          and that "{stat.field}" has non-null values to group.
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2.5,
                          maxHeight: '700px',
                          overflow: 'auto',
                          pr: 1,
                          '&::-webkit-scrollbar': {
                            width: '8px',
                          },
                          '&::-webkit-scrollbar-track': {
                            backgroundColor: '#f1f1f1',
                            borderRadius: '4px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: '#2196f3',
                            borderRadius: '4px',
                            '&:hover': {
                              backgroundColor: '#1976d2',
                            },
                          },
                        }}
                      >
                        {Array.from(stat.groupedStats.entries())
                          .sort((a, b) => a[0].localeCompare(b[0]))
                          .map(([groupValue, valueMap]) => {
                            const groupTotal = Array.from(
                              valueMap.values()
                            ).reduce((sum, count) => sum + count, 0);
                            return (
                              <Paper
                                key={groupValue}
                                elevation={2}
                                sx={{
                                  p: 2.5,
                                  background:
                                    'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                  border: '1px solid #e3e8ef',
                                  borderRadius: 2,
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    borderColor: '#2196f3',
                                  },
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                    mb: 2,
                                  }}
                                >
                                  <Typography
                                    variant="subtitle1"
                                    sx={{ fontWeight: 700, color: '#1976d2' }}
                                  >
                                    📅 {groupValue}
                                  </Typography>
                                  <Chip
                                    label={`${groupTotal} ${useUniquePapers ? 'papers' : 'records'}`}
                                    size="small"
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: '0.75rem',
                                    }}
                                    color="primary"
                                    variant="outlined"
                                  />
                                </Box>
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow
                                        sx={{ backgroundColor: '#f5f7fa' }}
                                      >
                                        <TableCell
                                          sx={{
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            color: '#455a64',
                                            py: 1.5,
                                          }}
                                        >
                                          Value
                                        </TableCell>
                                        <TableCell
                                          align="right"
                                          sx={{
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            color: '#455a64',
                                            py: 1.5,
                                          }}
                                        >
                                          Count
                                        </TableCell>
                                        <TableCell
                                          align="right"
                                          sx={{
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            color: '#455a64',
                                            py: 1.5,
                                          }}
                                        >
                                          % of {groupValue}
                                        </TableCell>
                                        <TableCell
                                          sx={{
                                            fontWeight: 700,
                                            minWidth: 150,
                                            fontSize: '0.8rem',
                                            color: '#455a64',
                                            py: 1.5,
                                          }}
                                        >
                                          Distribution
                                        </TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {Array.from(valueMap.entries())
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([value, count]) => {
                                          const percentage = (
                                            (count / groupTotal) *
                                            100
                                          ).toFixed(1);
                                          return (
                                            <TableRow
                                              key={value}
                                              sx={{
                                                '&:nth-of-type(odd)': {
                                                  backgroundColor: '#fafbfc',
                                                },
                                                '&:hover': {
                                                  backgroundColor: '#f0f7ff',
                                                  transition:
                                                    'background-color 0.2s',
                                                },
                                              }}
                                            >
                                              <TableCell
                                                sx={{
                                                  fontSize: '0.8rem',
                                                  fontWeight: 500,
                                                  color: '#37474f',
                                                  py: 1.5,
                                                }}
                                              >
                                                {value}
                                              </TableCell>
                                              <TableCell align="right">
                                                <Chip
                                                  label={count}
                                                  size="small"
                                                  sx={{
                                                    height: 22,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                  }}
                                                  color="default"
                                                />
                                              </TableCell>
                                              <TableCell
                                                align="right"
                                                sx={{
                                                  fontSize: '0.85rem',
                                                  fontWeight: 600,
                                                  color: '#1976d2',
                                                }}
                                              >
                                                {percentage}%
                                              </TableCell>
                                              <TableCell>
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                  }}
                                                >
                                                  <LinearProgress
                                                    variant="determinate"
                                                    value={parseFloat(
                                                      percentage
                                                    )}
                                                    sx={{
                                                      width: '100%',
                                                      height: 6,
                                                      borderRadius: 3,
                                                      backgroundColor:
                                                        '#e0e0e0',
                                                      '& .MuiLinearProgress-bar':
                                                        {
                                                          backgroundColor:
                                                            '#2196f3',
                                                        },
                                                    }}
                                                  />
                                                  <Typography
                                                    variant="caption"
                                                    sx={{
                                                      ml: 1,
                                                      minWidth: 40,
                                                      fontSize: '0.7rem',
                                                    }}
                                                  >
                                                    {percentage}%
                                                  </Typography>
                                                </Box>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </Paper>
                            );
                          })}
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            ))}
          </Box>
        )}
      </AccordionDetails>

      {/* Column Selector Popover */}
      <Popover
        open={Boolean(columnsAnchor)}
        anchorEl={columnsAnchor}
        onClose={() => setColumnsAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2.5, minWidth: 320, maxWidth: 400 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <ViewColumn sx={{ color: '#1976d2' }} />
            Select Columns
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <FormControl fullWidth>
            <Select
              multiple
              value={selectedColumns}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedColumns(
                  typeof value === 'string' ? value.split(',') : value
                );
              }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
              displayEmpty
            >
              {availableColumns.length === 0 ? (
                <MenuItem disabled>
                  <em>No columns available</em>
                </MenuItem>
              ) : (
                availableColumns.map((column) => (
                  <MenuItem key={column} value={column}>
                    <Checkbox checked={selectedColumns.indexOf(column) > -1} />
                    <ListItemText primary={column} />
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1.5, display: 'block' }}
          >
            💡 Values are automatically capitalized and case-insensitive. Null,
            undefined, none, and nan values are excluded.
          </Typography>
        </Box>
      </Popover>

      {/* Group By Popover */}
      <Popover
        open={Boolean(groupByAnchor)}
        anchorEl={groupByAnchor}
        onClose={() => setGroupByAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2.5, minWidth: 280 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <FilterList sx={{ color: '#9c27b0' }} />
            Group By Column
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <FormControl fullWidth size="small">
            <InputLabel id="group-by-popover-label">Group By</InputLabel>
            <Select
              labelId="group-by-popover-label"
              value={groupByColumn}
              onChange={(e) => setGroupByColumn(e.target.value)}
              label="Group By"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {availableColumns.map((column) => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1.5, display: 'block' }}
          >
            📊 Show statistics broken down by another column (e.g., by year)
          </Typography>
        </Box>
      </Popover>

      {/* Analysis Settings Popover */}
      <Popover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={() => setSettingsAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2.5, minWidth: 320 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Settings sx={{ color: '#4caf50' }} />
            Analysis Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <FormControlLabel
            control={
              <Switch
                checked={useUniquePapers}
                onChange={(e) => setUseUniquePapers(e.target.checked)}
                color="success"
              />
            }
            label={
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Count by Unique Papers
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Calculate percentages based on unique papers (like pandas
                  drop_duplicates)
                </Typography>
              </Box>
            }
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mt: 1.5,
              display: 'block',
              p: 1,
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
            }}
          >
            ✨ When enabled, each paper is counted only once per value, matching
            pandas behavior.
          </Typography>
        </Box>
      </Popover>
    </Accordion>
  );
};

export default GridStats;

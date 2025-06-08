import * as React from 'react';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import { Query } from '../../constants/queries_chart_info';

type ChartParamsSelectorProps = {
  normalized: boolean;
  setNormalized: React.Dispatch<React.SetStateAction<boolean>>;
  query: Query;
};

function ChartParamsSelector({
  normalized,
  setNormalized,
  query,
}: ChartParamsSelectorProps) {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: boolean | null
  ) => {
    if (newValue !== null) {
      setNormalized(newValue);
    }
  };

  return (
    <Stack
      direction="column"
      justifyContent="space-between"
      sx={{ width: '100%' }}
    >
      <FormControl component="fieldset">
        <FormLabel component="legend">Chart Options</FormLabel>

        <ToggleButtonGroup
          value={normalized}
          exclusive
          onChange={handleChange}
          aria-label="normalization toggle"
          size="small"
          sx={{ mt: 1 }}
          key={query.uid}
        >
          <ToggleButton value={true} aria-label="normalized">
            Relative
          </ToggleButton>
          <ToggleButton value={false} aria-label="raw">
            Absolute
          </ToggleButton>
        </ToggleButtonGroup>
      </FormControl>
    </Stack>
  );
}

export default ChartParamsSelector;

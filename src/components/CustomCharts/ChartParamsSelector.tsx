import * as React from 'react';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
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
  const checkNormalizedOption = (query: Query): boolean => {
    if (query?.chartSettings.series?.[0]?.dataKey === 'normalizedRatio') {
      return true;
    }
    return false;
  };

  const normalizedOption = checkNormalizedOption(query);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    if (name === 'normalized') setNormalized(checked);
  };

  return (
    <Stack
      direction="column"
      justifyContent="space-between"
      sx={{ width: '100%' }}
    >
      <FormControl component="fieldset">
        <FormLabel component="legend">Chart Options</FormLabel>
        <FormGroup>
          {normalizedOption ? (
            <FormControlLabel
              control={
                <Checkbox
                  checked={normalized}
                  onChange={handleChange}
                  name="normalized"
                />
              }
              label="Normalized"
            />
          ) : (
            <></>
          )}
        </FormGroup>
      </FormControl>
    </Stack>
  );
}

export default ChartParamsSelector;

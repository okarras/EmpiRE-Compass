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
  categorizeByVenue: boolean;
  setCategorizeByVenue: React.Dispatch<React.SetStateAction<boolean>>;
  showVenueCategorization: boolean;
  /** When true, hide Relative/Absolute (chart uses raw counts only). */
  hideNormalization?: boolean;
};

function ChartParamsSelector({
  normalized,
  setNormalized,
  query,
  categorizeByVenue,
  setCategorizeByVenue,
  showVenueCategorization,
  hideNormalization = false,
}: ChartParamsSelectorProps) {
  const handleNormChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: boolean | null
  ) => {
    if (newValue !== null) {
      setNormalized(newValue);
    }
  };

  const handleVenueChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: boolean | null
  ) => {
    if (newValue !== null) {
      setCategorizeByVenue(newValue);
    }
  };

  const showAnyOptions = !hideNormalization || showVenueCategorization;
  if (!showAnyOptions) {
    return null;
  }

  return (
    <Stack
      direction="column"
      justifyContent="flex-start"
      spacing={2}
      sx={{ width: '100%' }}
    >
      {!hideNormalization && (
        <FormControl component="fieldset">
          <FormLabel component="legend">Chart Options</FormLabel>
          <ToggleButtonGroup
            value={normalized}
            exclusive
            onChange={handleNormChange}
            aria-label="normalization toggle"
            size="small"
            sx={{ mt: 1 }}
            key={`${query.uid}-norm`}
          >
            <ToggleButton value={true} aria-label="normalized">
              Relative
            </ToggleButton>
            <ToggleButton value={false} aria-label="raw">
              Absolute
            </ToggleButton>
          </ToggleButtonGroup>
        </FormControl>
      )}

      {showVenueCategorization && (
        <FormControl component="fieldset">
          <FormLabel component="legend">Venue</FormLabel>
          <ToggleButtonGroup
            value={categorizeByVenue}
            exclusive
            onChange={handleVenueChange}
            aria-label="categorize by venue"
            size="small"
            sx={{ mt: 1 }}
            key={`${query.uid}-venue`}
          >
            <ToggleButton value={false} aria-label="combined">
              Combined
            </ToggleButton>
            <ToggleButton value={true} aria-label="by venue">
              By venue
            </ToggleButton>
          </ToggleButtonGroup>
        </FormControl>
      )}
    </Stack>
  );
}

export default ChartParamsSelector;

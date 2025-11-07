import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Typography from '@mui/material/Typography';

type Props = {
  desc?: string;
  label?: string;
};

const InfoTooltip: React.FC<Props> = ({ desc, label }) => {
  if (!desc) return null;
  return (
    <Tooltip
      title={
        <Typography variant="body2" sx={{ maxWidth: 420 }}>
          {desc}
        </Typography>
      }
      arrow
      enterDelay={300}
      leaveDelay={50}
      enterTouchDelay={0}
      followCursor
    >
      <IconButton
        size="small"
        sx={{ ml: 0.5, p: 0.5, minWidth: 30 }}
        onMouseDown={(e) => e.stopPropagation()}
        aria-label={label ?? 'info'}
      >
        <InfoOutlinedIcon fontSize="small" color="action" />
      </IconButton>
    </Tooltip>
  );
};

export default InfoTooltip;

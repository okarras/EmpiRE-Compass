import { Box, Paper, Typography } from '@mui/material';

export interface ShareMetric {
  title: string;
  value: number;
  max: number;
  totalLabel: string;
  link?: string;
}

export interface ShareSection {
  kicker: string;
  description: string;
  metrics: ShareMetric[];
}

const sharePercent = (value: number, max: number) => {
  if (max <= 0 || value <= 0) return '0%';
  const percent = (value / max) * 100;
  if (percent < 0.01) return '<0.01%';
  if (percent < 10) return `${percent.toFixed(2)}%`;
  return `${Math.round(percent)}%`;
};

const openLink = (link?: string) => {
  if (link) window.open(link, '_blank', 'noopener,noreferrer');
};

function MetricFigure({
  metric,
  showTitle,
}: {
  metric: ShareMetric;
  showTitle: boolean;
}) {
  const interactive = Boolean(metric.link);

  return (
    <Box
      role={interactive ? 'link' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={() => openLink(metric.link)}
      onKeyDown={(event) => {
        if (interactive && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          openLink(metric.link);
        }
      }}
      sx={{
        minWidth: 0,
        cursor: interactive ? 'pointer' : 'default',
        borderRadius: 2,
        outline: 'none',
        '&:hover .share-title': interactive ? { color: '#b13737' } : undefined,
      }}
    >
      {showTitle && (
        <Typography className="share-title" sx={{ fontWeight: 700, mb: 1 }}>
          {metric.title}
        </Typography>
      )}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '2rem',
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}
      >
        {sharePercent(metric.value, metric.max)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
        {metric.value.toLocaleString()} of {metric.max.toLocaleString()}{' '}
        {metric.totalLabel}
      </Typography>
    </Box>
  );
}

export default function ShareOverview({
  sections,
}: {
  sections: ShareSection[];
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 4 }}>
      {sections.map((section) => (
        <Paper
          key={section.kicker}
          elevation={0}
          sx={{
            p: { xs: 2.25, sm: 3 },
            borderRadius: 3,
            border: '1px solid rgba(232, 97, 97, 0.14)',
            background: 'linear-gradient(180deg, #ffffff 0%, #fff8f7 100%)',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#b13737',
            }}
          >
            {section.kicker}
          </Typography>
          <Typography
            sx={{ mt: 0.75, mb: 2.5, maxWidth: 720, color: 'text.secondary' }}
          >
            {section.description}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns:
                section.metrics.length > 1
                  ? { xs: '1fr', md: '1fr 1fr' }
                  : '1fr',
              gap: 3,
            }}
          >
            {section.metrics.map((metric) => (
              <MetricFigure
                key={metric.title}
                metric={metric}
                showTitle={section.metrics.length > 1}
              />
            ))}
          </Box>
        </Paper>
      ))}
    </Box>
  );
}

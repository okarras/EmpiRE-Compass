import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { ExpandMore, Info } from '@mui/icons-material';

const ChartSettingsHelp = () => {
  return (
    <Accordion sx={{ mb: 2, backgroundColor: 'rgba(33, 150, 243, 0.05)' }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Info color="info" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            📚 Chart Settings Reference Guide
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Basic Properties */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                display: 'block',
                mb: 1,
                color: '#e86161',
              }}
            >
              🎯 Basic Properties
            </Typography>
            <Box
              sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}
            >
              <Typography variant="caption" display="block">
                <code>"heading"</code>: <strong>string</strong> - Chart title
                (e.g., "Number of papers per year")
              </Typography>
              <Typography variant="caption" display="block">
                <code>"className"</code>: <strong>string</strong> - CSS class
                ("fullWidth", "fullWidth fixText", etc.)
              </Typography>
              <Typography variant="caption" display="block">
                <code>"height"</code>: <strong>number</strong> - Chart height in
                pixels (e.g., 400)
              </Typography>
              <Typography variant="caption" display="block">
                <code>"barLabel"</code>: <strong>string</strong> - Bar label
                position ("value", "none")
              </Typography>
            </Box>
          </Box>

          <Divider />

          {/* X-Axis Configuration */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                display: 'block',
                mb: 1,
                color: '#e86161',
              }}
            >
              📊 X-Axis Configuration
            </Typography>
            <Box
              sx={{
                pl: 2,
                backgroundColor: '#f8f9fa',
                p: 1.5,
                borderRadius: 1,
                mb: 1,
              }}
            >
              <code style={{ fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                {`"xAxis": [
  {
    "scaleType": "band",        // "band" for categorical, "linear" for numeric
    "dataKey": "year",          // Property name from dataset
    "label": "Year",            // Axis label
    "tickPlacement": "middle"   // "middle" or "extremities"
  }
]`}
              </code>
            </Box>
            <Typography variant="caption" display="block" sx={{ pl: 2 }}>
              <strong>dataKey:</strong> Must match property in dataset (e.g.,
              "year", "method", "methodType")
            </Typography>
          </Box>

          <Divider />

          {/* Y-Axis Configuration */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                display: 'block',
                mb: 1,
                color: '#e86161',
              }}
            >
              📈 Y-Axis Configuration
            </Typography>
            <Box
              sx={{
                pl: 2,
                backgroundColor: '#f8f9fa',
                p: 1.5,
                borderRadius: 1,
                mb: 1,
              }}
            >
              <code style={{ fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                {`// Vertical Chart (normal)
"yAxis": [
  { "label": "Paper count" }
]

// Horizontal Chart
"yAxis": [
  {
    "scaleType": "band",
    "dataKey": "methodType",  // For horizontal bars
    "label": "Method Type"
  }
]`}
              </code>
            </Box>
            <Typography variant="caption" display="block" sx={{ pl: 2 }}>
              For horizontal charts, Y-axis becomes categorical (uses band scale
              + dataKey)
            </Typography>
          </Box>

          <Divider />

          {/* Series Configuration */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                display: 'block',
                mb: 1,
                color: '#e86161',
              }}
            >
              📊 Series Configuration
            </Typography>
            <Box
              sx={{
                pl: 2,
                backgroundColor: '#f8f9fa',
                p: 1.5,
                borderRadius: 1,
                mb: 1,
              }}
            >
              <code style={{ fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                {`// Single Series
"series": [
  { "dataKey": "normalizedRatio" }
]

// Multiple Series (stacked/grouped bars)
"series": [
  { "dataKey": "case study", "label": "Case studies" },
  { "dataKey": "experiment", "label": "Experiments" },
  { "dataKey": "survey", "label": "Survey" }
]`}
              </code>
            </Box>
            <Typography
              variant="caption"
              display="block"
              sx={{ pl: 2, mb: 0.5 }}
            >
              <strong>dataKey:</strong> Property from dataset to visualize
            </Typography>
            <Typography variant="caption" display="block" sx={{ pl: 2 }}>
              <strong>label:</strong> Legend text (optional, defaults to
              dataKey)
            </Typography>
          </Box>

          <Divider />

          {/* Colors */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                display: 'block',
                mb: 1,
                color: '#e86161',
              }}
            >
              🎨 Colors
            </Typography>
            <Box
              sx={{
                pl: 2,
                backgroundColor: '#f8f9fa',
                p: 1.5,
                borderRadius: 1,
                mb: 1,
              }}
            >
              <code style={{ fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                {`// Single Color
"colors": ["#e86161"]

// Multiple Colors (one per series)
"colors": [
  "#4c72b0",  // Blue
  "#dd8452",  // Orange
  "#55a868",  // Green
  "#c44e52"   // Red
]`}
              </code>
            </Box>
            <Typography variant="caption" display="block" sx={{ pl: 2 }}>
              Provide one color per series. Use hex codes (#RRGGBB).
            </Typography>
          </Box>

          <Divider />

          {/* Layout & Margin */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                display: 'block',
                mb: 1,
                color: '#e86161',
              }}
            >
              📐 Layout & Margins
            </Typography>
            <Box
              sx={{
                pl: 2,
                backgroundColor: '#f8f9fa',
                p: 1.5,
                borderRadius: 1,
                mb: 1,
              }}
            >
              <code style={{ fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                {`// Horizontal Bars
"layout": "horizontal",
"margin": {
  "left": 150,    // Space for Y-axis labels
  "right": 20,
  "top": 20,
  "bottom": 40
}

// Custom Margin (vertical chart)
"margin": {
  "left": 60,
  "right": 20,
  "top": 120,   // For top legend
  "bottom": 40
}`}
              </code>
            </Box>
            <Typography
              variant="caption"
              display="block"
              sx={{ pl: 2, mb: 0.5 }}
            >
              <strong>layout: "horizontal"</strong> - Flips the chart (bars go
              right instead of up)
            </Typography>
            <Typography variant="caption" display="block" sx={{ pl: 2 }}>
              <strong>margin.left:</strong> Increase if Y-axis labels are cut
              off (try 150-190 for long labels)
            </Typography>
          </Box>

          <Divider />

          {/* Bar Spacing */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                display: 'block',
                mb: 1,
                color: '#e86161',
              }}
            >
              📏 Bar Spacing & Width
            </Typography>
            <Box
              sx={{
                pl: 2,
                backgroundColor: '#f8f9fa',
                p: 1.5,
                borderRadius: 1,
                mb: 1,
              }}
            >
              <code style={{ fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                {`"barCategoryGap": 0.1,   // Gap between categories (0-1)
"barGap": 0.05,           // Gap between bars in same category (0-1)
"barWidth": 12            // Bar width in pixels`}
              </code>
            </Box>
            <Typography
              variant="caption"
              display="block"
              sx={{ pl: 2, mb: 0.5 }}
            >
              <strong>barCategoryGap:</strong> 0.1 = tight, 0.5 = loose
            </Typography>
            <Typography variant="caption" display="block" sx={{ pl: 2 }}>
              <strong>barWidth:</strong> Useful for many bars (e.g., 10-12 for
              tight spacing)
            </Typography>
          </Box>

          <Divider />

          {/* Legend & Display Options */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                display: 'block',
                mb: 1,
                color: '#e86161',
              }}
            >
              🎭 Legend & Display Options
            </Typography>
            <Box
              sx={{
                pl: 2,
                backgroundColor: '#f8f9fa',
                p: 1.5,
                borderRadius: 1,
                mb: 1,
              }}
            >
              <code style={{ fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                {`"hideDetailedChartLegend": true,   // Hide legend for cleaner look
"noHeadingInSeries": true,          // Hide heading in multi-series
"seriesHeadingTemplate": "number of {label} used"  // Template for series titles`}
              </code>
            </Box>
            <Typography variant="caption" display="block" sx={{ pl: 2 }}>
              <strong>hideDetailedChartLegend:</strong> Use for many series
              (10+) to save space
            </Typography>
          </Box>

          <Divider />

          {/* Complete Example */}
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                display: 'block',
                mb: 1,
                color: '#e86161',
              }}
            >
              ✨ Complete Example (Horizontal Chart with Multiple Series)
            </Typography>
            <Box
              sx={{
                pl: 2,
                backgroundColor: '#1e1e1e',
                p: 1.5,
                borderRadius: 1,
              }}
            >
              <code
                style={{
                  fontSize: '0.7rem',
                  whiteSpace: 'pre-wrap',
                  color: '#d4d4d4',
                }}
              >
                {`{
  "heading": "Empirical methods used for data collection",
  "className": "fullWidth fixText",
  "layout": "horizontal",
  "height": 400,
  "xAxis": [
    {
      "scaleType": "band",
      "dataKey": "year",
      "label": "Year"
    }
  ],
  "yAxis": [
    {
      "scaleType": "band",
      "dataKey": "methodType",
      "label": "Empirical method used"
    }
  ],
  "series": [
    { "dataKey": "normalizedRatio" }
  ],
  "colors": ["#4c72b0", "#dd8452", "#55a868"],
  "margin": {
    "left": 150,
    "right": 20
  },
  "barLabel": "value",
  "hideDetailedChartLegend": true
}`}
              </code>
            </Box>
          </Box>

          {/* Tips */}
          <Box
            sx={{
              backgroundColor: 'rgba(232, 97, 97, 0.05)',
              p: 1.5,
              borderRadius: 1,
              borderLeft: '4px solid #e86161',
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, display: 'block', mb: 1 }}
            >
              💡 Pro Tips
            </Typography>
            <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
              • Start with an existing question's settings and modify
            </Typography>
            <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
              • For long Y-axis labels (horizontal charts): increase margin.left
              to 150-190
            </Typography>
            <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
              • For many series (10+): set hideDetailedChartLegend: true
            </Typography>
            <Typography variant="caption" display="block">
              • dataKey must exactly match the property name in your processed
              data
            </Typography>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default ChartSettingsHelp;

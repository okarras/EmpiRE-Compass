import { Paper, Typography, Box } from '@mui/material';
import { useEffect, useRef } from 'react';

interface ChatMessageProps {
  content: string;
  isUser: boolean;
  reasoning?: string;
  showReasoning?: boolean;
  chartHtml?: string;
  showChart?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  isUser,
  reasoning,
  showReasoning,
  chartHtml,
  showChart,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartHtml && showChart && chartRef.current) {
      // Load Chart.js if not already loaded
      if (!window.Chart) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.async = true;
        script.onload = () => {
          if (chartRef.current) {
            // Create container for the chart
            chartRef.current.innerHTML = `
              <div style="width: 100%; height: 400px; position: relative;">
                <canvas id="chart-${Date.now()}"></canvas>
              </div>
            `;
            
            // Extract chart configuration from the provided HTML
            const chartConfigMatch = chartHtml.match(/new Chart\(.*?,\s*({[\s\S]*?})\);/);
            if (chartConfigMatch) {
              try {
                const chartConfig = eval(`(${chartConfigMatch[1]})`);
                const canvas = chartRef.current.querySelector('canvas');
                if (canvas) {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    new window.Chart(ctx, chartConfig);
                  }
                }
              } catch (error) {
                console.error('Error initializing chart:', error);
              }
            }
          }
        };
        document.head.appendChild(script);
      } else {
        // Create container for the chart
        chartRef.current.innerHTML = `
          <div style="width: 100%; height: 200px; position: relative;">
            <canvas id="chart-${Date.now()}"></canvas>
          </div>
        `;
        
        // Extract chart configuration from the provided HTML
        const chartConfigMatch = chartHtml.match(/new Chart\(.*?,\s*({[\s\S]*?})\);/);
        if (chartConfigMatch) {
          try {
            const chartConfig = eval(`(${chartConfigMatch[1]})`);
            const canvas = chartRef.current.querySelector('canvas');
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                new window.Chart(ctx, chartConfig);
              }
            }
          } catch (error) {
            console.error('Error initializing chart:', error);
          }
        }
      }
    }
  }, [chartHtml, showChart]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          maxWidth: '80%',
          backgroundColor: isUser ? '#e86161' : 'background.paper',
          color: isUser ? 'white' : 'text.primary',
          borderRadius: 2,
          border: isUser ? 'none' : '1px solid',
          borderColor: 'divider',
          '& pre': {
            backgroundColor: isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            padding: '1rem',
            borderRadius: '4px',
            overflowX: 'auto',
            margin: '1rem 0',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            '& code': {
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            },
          },
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: content }} />
        
        {chartHtml && showChart && (
          <Box
            ref={chartRef}
            sx={{
              mt: 2,
              width: '100%',
              position: 'relative',
            }}
          />
        )}

        {reasoning && showReasoning && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                fontStyle: 'italic',
              }}
            >
              AI Reasoning:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                mt: 1,
              }}
            >
              {reasoning}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ChatMessage;
